-- Drop existing functions with exact signatures
DROP FUNCTION IF EXISTS get_user_card_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS initialize_monthly_usage(uuid) CASCADE;
DROP FUNCTION IF EXISTS increment_scan_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS maintain_usage_stats() CASCADE;
DROP FUNCTION IF EXISTS reset_all_usage_stats() CASCADE;
DROP FUNCTION IF EXISTS initialize_all_users_usage() CASCADE;

-- Drop existing trigger explicitly
DROP TRIGGER IF EXISTS usage_stats_trigger ON business_cards;

-- Function to get accurate card stats
CREATE FUNCTION get_user_card_stats(user_id_param UUID)
RETURNS TABLE (
    total_cards BIGINT,
    unique_companies BIGINT,
    scans_this_month BIGINT
) AS $$
DECLARE
    current_month DATE;
BEGIN
    -- Get current month
    current_month := date_trunc('month', CURRENT_DATE);
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM business_cards WHERE user_id = user_id_param) as total_cards,
        (SELECT COUNT(DISTINCT LOWER(company))::BIGINT FROM business_cards WHERE user_id = user_id_param AND company IS NOT NULL) as unique_companies,
        COALESCE((
            SELECT scans_count::BIGINT 
            FROM subscription_usage 
            WHERE user_id = user_id_param 
            AND month = current_month
        ), 0) as scans_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize or reset monthly usage
CREATE FUNCTION initialize_monthly_usage(user_id_param UUID)
RETURNS void AS $$
DECLARE
    current_month DATE;
    stats RECORD;
BEGIN
    -- Get current month
    current_month := date_trunc('month', CURRENT_DATE);
    
    -- Get current stats
    SELECT * FROM get_user_card_stats(user_id_param) INTO stats;
    
    -- Insert or update usage record
    INSERT INTO subscription_usage (
        user_id,
        month,
        scans_count,
        companies_tracked
    ) VALUES (
        user_id_param,
        current_month,
        stats.scans_this_month,
        stats.unique_companies
    )
    ON CONFLICT (user_id, month) 
    DO UPDATE SET
        companies_tracked = EXCLUDED.companies_tracked,
        scans_count = EXCLUDED.scans_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment scan count safely
CREATE FUNCTION increment_scan_count(user_id_param UUID)
RETURNS boolean AS $$
DECLARE
    current_month DATE;
    current_tier TEXT;
    monthly_limit INTEGER;
    current_count INTEGER;
BEGIN
    -- Get current month
    current_month := date_trunc('month', CURRENT_DATE);
    
    -- Get user's subscription tier
    SELECT tier INTO current_tier
    FROM subscriptions
    WHERE user_id = user_id_param;
    
    -- Set monthly limit based on tier
    monthly_limit := CASE 
        WHEN current_tier = 'pro' THEN 2147483647  -- Max INT for "unlimited"
        WHEN current_tier = 'basic' THEN 30
        ELSE 5  -- Free tier
    END;
    
    -- Get current scan count
    SELECT scans_count INTO current_count
    FROM subscription_usage
    WHERE user_id = user_id_param AND month = current_month;
    
    -- Initialize if no record exists
    IF current_count IS NULL THEN
        PERFORM initialize_monthly_usage(user_id_param);
        current_count := 0;
    END IF;
    
    -- Check if limit reached
    IF current_count >= monthly_limit THEN
        RETURN false;
    END IF;
    
    -- Increment scan count
    UPDATE subscription_usage
    SET scans_count = scans_count + 1
    WHERE user_id = user_id_param AND month = current_month;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to maintain usage stats
CREATE FUNCTION maintain_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize usage stats if needed
    PERFORM initialize_monthly_usage(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.user_id
            ELSE NEW.user_id
        END
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER usage_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON business_cards
FOR EACH ROW
EXECUTE FUNCTION maintain_usage_stats();

-- Initialize usage for all existing users
CREATE FUNCTION initialize_all_users_usage()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM business_cards LOOP
        PERFORM initialize_monthly_usage(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 