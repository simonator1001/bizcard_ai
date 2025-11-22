-- Get the user ID for simon.ckchow@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'simon.ckchow@gmail.com';

    -- Update the user's usage stats
    INSERT INTO user_usage_stats (
        user_id,
        scans_this_month,
        unique_companies,
        cards_count,
        last_updated
    )
    SELECT
        target_user_id,
        5, -- Set scans_this_month to 5 (free tier limit)
        (SELECT COUNT(DISTINCT LOWER(company))::INTEGER FROM business_cards WHERE user_id = target_user_id AND company IS NOT NULL),
        (SELECT COUNT(*)::INTEGER FROM business_cards WHERE user_id = target_user_id),
        CURRENT_TIMESTAMP
    ON CONFLICT (user_id) DO UPDATE SET
        scans_this_month = 5, -- Set scans_this_month to 5 (free tier limit)
        unique_companies = EXCLUDED.unique_companies,
        cards_count = EXCLUDED.cards_count,
        last_updated = CURRENT_TIMESTAMP;
END $$; 