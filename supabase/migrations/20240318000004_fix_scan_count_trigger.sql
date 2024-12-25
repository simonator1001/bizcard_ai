-- Function to check and update scan count
CREATE OR REPLACE FUNCTION check_and_update_scan_count()
RETURNS TRIGGER AS $$
DECLARE
    current_month DATE;
    user_subscription RECORD;
    monthly_limit INTEGER;
    current_usage RECORD;
BEGIN
    -- Get current month
    current_month := date_trunc('month', CURRENT_DATE);
    
    -- Get user's subscription
    SELECT tier INTO user_subscription
    FROM subscriptions
    WHERE user_id = NEW.user_id;
    
    -- Set monthly limit based on subscription tier
    monthly_limit := CASE 
        WHEN user_subscription.tier = 'pro' THEN 2147483647  -- Max INT for "unlimited"
        WHEN user_subscription.tier = 'basic' THEN 30
        ELSE 5  -- Free tier
    END;
    
    -- Get current month's usage
    SELECT * INTO current_usage
    FROM subscription_usage
    WHERE user_id = NEW.user_id AND month = current_month;
    
    -- If no usage record exists, create one
    IF NOT FOUND THEN
        INSERT INTO subscription_usage (
            user_id,
            month,
            scans_count,
            companies_tracked
        ) VALUES (
            NEW.user_id,
            current_month,
            1,
            0
        );
    ELSE
        -- Check if user has exceeded their monthly limit
        IF current_usage.scans_count >= monthly_limit THEN
            RAISE EXCEPTION 'Monthly scan limit reached';
        END IF;
        
        -- Update scan count
        UPDATE subscription_usage
        SET scans_count = scans_count + 1
        WHERE user_id = NEW.user_id AND month = current_month;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS check_scan_count_trigger ON business_cards;
CREATE TRIGGER check_scan_count_trigger
BEFORE INSERT ON business_cards
FOR EACH ROW
EXECUTE FUNCTION check_and_update_scan_count(); 