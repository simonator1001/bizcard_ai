-- Function to initialize subscription usage for new users
CREATE OR REPLACE FUNCTION initialize_subscription_usage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscription_usage (
        user_id,
        month,
        scans_count,
        companies_tracked
    ) VALUES (
        NEW.user_id,
        date_trunc('month', CURRENT_DATE),
        0,
        0
    ) ON CONFLICT (user_id, month) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize usage when a new subscription is created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'initialize_subscription_usage_trigger') THEN
        CREATE TRIGGER initialize_subscription_usage_trigger
            AFTER INSERT ON subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION initialize_subscription_usage();
    END IF;
END $$;

-- Function to handle subscription tier changes
CREATE OR REPLACE FUNCTION handle_subscription_tier_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log subscription change in history
    INSERT INTO subscription_history (
        user_id,
        action,
        previous_plan,
        new_plan
    ) VALUES (
        NEW.user_id,
        CASE
            WHEN OLD.tier IS NULL THEN 'subscription_created'
            WHEN NEW.tier != OLD.tier THEN 'tier_changed'
            WHEN NEW.status != OLD.status THEN 'status_changed'
            ELSE 'subscription_updated'
        END,
        OLD.tier::TEXT,
        NEW.tier::TEXT
    );

    -- Reset usage counters if downgrading to free tier
    IF OLD.tier != 'free' AND NEW.tier = 'free' THEN
        UPDATE subscription_usage
        SET scans_count = 0,
            companies_tracked = 0
        WHERE user_id = NEW.user_id
        AND month = date_trunc('month', CURRENT_DATE);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle subscription changes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_subscription_tier_change_trigger') THEN
        CREATE TRIGGER handle_subscription_tier_change_trigger
            AFTER UPDATE ON subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION handle_subscription_tier_change();
    END IF;
END $$;

-- Function to enforce subscription limits
CREATE OR REPLACE FUNCTION enforce_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_usage subscription_usage;
    tier_limits RECORD;
BEGIN
    -- Get current usage
    SELECT * INTO current_usage
    FROM subscription_usage
    WHERE user_id = NEW.user_id
    AND month = date_trunc('month', CURRENT_DATE);

    -- Get tier limits
    SELECT
        CASE 
            WHEN s.tier = 'free' THEN 5
            WHEN s.tier = 'basic' THEN 30
            ELSE NULL -- null means unlimited for pro/enterprise
        END as scan_limit,
        CASE 
            WHEN s.tier = 'free' THEN 3
            WHEN s.tier = 'basic' THEN 10
            ELSE NULL -- null means unlimited for pro/enterprise
        END as company_limit
    INTO tier_limits
    FROM subscriptions s
    WHERE s.user_id = NEW.user_id;

    -- Check scan limit
    IF tier_limits.scan_limit IS NOT NULL 
    AND current_usage.scans_count >= tier_limits.scan_limit THEN
        RAISE EXCEPTION 'Scan limit reached for current subscription tier';
    END IF;

    -- Check company limit
    IF tier_limits.company_limit IS NOT NULL 
    AND current_usage.companies_tracked >= tier_limits.company_limit THEN
        RAISE EXCEPTION 'Company tracking limit reached for current subscription tier';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limits before insert
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_subscription_limits_trigger') THEN
        CREATE TRIGGER enforce_subscription_limits_trigger
            BEFORE INSERT ON business_cards
            FOR EACH ROW
            EXECUTE FUNCTION enforce_subscription_limits();
    END IF;
END $$;

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscription_usage (
        user_id,
        month,
        scans_count,
        companies_tracked
    ) VALUES (
        NEW.user_id,
        date_trunc('month', CURRENT_DATE),
        1,
        0
    ) ON CONFLICT (user_id, month) DO UPDATE
    SET scans_count = subscription_usage.scans_count + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment scan count when a card is added
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'increment_scan_count_trigger') THEN
        CREATE TRIGGER increment_scan_count_trigger
            AFTER INSERT ON business_cards
            FOR EACH ROW
            EXECUTE FUNCTION increment_scan_count();
    END IF;
END $$; 