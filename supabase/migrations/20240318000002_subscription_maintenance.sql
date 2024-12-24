-- Function to run monthly subscription maintenance
CREATE OR REPLACE FUNCTION run_subscription_maintenance()
RETURNS void AS $$
BEGIN
    -- Reset monthly usage for all users
    INSERT INTO subscription_usage (
        user_id,
        month,
        scans_count,
        companies_tracked
    )
    SELECT DISTINCT
        u.id as user_id,
        date_trunc('month', CURRENT_DATE),
        COALESCE((
            SELECT COUNT(*)
            FROM business_cards bc
            WHERE bc.user_id = u.id
        ), 0) as scans_count,
        COALESCE((
            SELECT companies_tracked 
            FROM subscription_usage su 
            WHERE su.user_id = u.id 
            AND su.month = date_trunc('month', CURRENT_DATE - interval '1 month')
        ), 0)
    FROM auth.users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    ON CONFLICT (user_id, month) DO UPDATE
    SET scans_count = EXCLUDED.scans_count;

    -- Handle subscription renewals
    UPDATE subscriptions
    SET current_period_start = CURRENT_DATE,
        current_period_end = CASE
            WHEN payment_provider IS NOT NULL THEN CURRENT_DATE + interval '1 month'
            ELSE NULL
        END
    WHERE status = 'active'
    AND current_period_end <= CURRENT_DATE
    AND NOT cancel_at_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure maintenance endpoint that can be called with anon key
CREATE OR REPLACE FUNCTION public.maintenance_endpoint(maintenance_key TEXT)
RETURNS json AS $$
DECLARE
    stored_key TEXT;
BEGIN
    -- Get the stored maintenance key
    SELECT value INTO stored_key FROM app_settings WHERE key = 'maintenance_key';
    
    -- Verify the maintenance key
    IF maintenance_key != stored_key THEN
        RAISE EXCEPTION 'Invalid maintenance key';
    END IF;

    -- Run maintenance
    PERFORM run_subscription_maintenance();
    
    RETURN json_build_object('message', 'Maintenance completed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon role
REVOKE ALL ON FUNCTION public.maintenance_endpoint(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maintenance_endpoint(TEXT) TO anon; 