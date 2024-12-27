-- Drop everything first
DROP TRIGGER IF EXISTS usage_stats_trigger ON business_cards;
DROP TRIGGER IF EXISTS update_usage_stats_trigger ON business_cards;
DROP FUNCTION IF EXISTS get_user_card_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS initialize_monthly_usage(uuid) CASCADE;
DROP FUNCTION IF EXISTS increment_scan_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS maintain_usage_stats() CASCADE;
DROP FUNCTION IF EXISTS update_usage_stats() CASCADE;
DROP FUNCTION IF EXISTS reset_all_usage_stats() CASCADE;
DROP FUNCTION IF EXISTS initialize_all_users_usage() CASCADE;

-- Drop and recreate the user_usage_stats table
DROP TABLE IF EXISTS user_usage_stats;
CREATE TABLE user_usage_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    scans_this_month INTEGER DEFAULT 0,
    unique_companies INTEGER DEFAULT 0,
    cards_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create base function for stats
CREATE OR REPLACE FUNCTION get_user_card_stats(user_id_param UUID)
RETURNS TABLE (
    scans_this_month INTEGER,
    unique_companies INTEGER,
    cards_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::INTEGER as scans_this_month,
        COUNT(DISTINCT LOWER(company))::INTEGER as unique_companies,
        COUNT(*)::INTEGER as cards_count
    FROM business_cards
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function
CREATE OR REPLACE FUNCTION update_usage_stats()
RETURNS TRIGGER AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Get current stats
    SELECT * FROM get_user_card_stats(COALESCE(NEW.user_id, OLD.user_id)) INTO stats;
    
    -- Update stats
    INSERT INTO user_usage_stats (
        user_id,
        scans_this_month,
        unique_companies,
        cards_count,
        last_updated
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        stats.scans_this_month,
        stats.unique_companies,
        stats.cards_count,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE SET
        scans_this_month = EXCLUDED.scans_this_month,
        unique_companies = EXCLUDED.unique_companies,
        cards_count = EXCLUDED.cards_count,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_usage_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON business_cards
FOR EACH ROW
EXECUTE FUNCTION update_usage_stats();

-- Set up RLS
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own usage stats" ON user_usage_stats;
DROP POLICY IF EXISTS "Allow trigger function to update stats" ON user_usage_stats;
DROP POLICY IF EXISTS "Service role full access" ON user_usage_stats;

-- Create new policies
CREATE POLICY "Users can view their own usage stats"
ON user_usage_stats FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow trigger function to update stats"
ON user_usage_stats FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access"
ON user_usage_stats FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Initialize stats for all existing users
INSERT INTO user_usage_stats (
    user_id,
    scans_this_month,
    unique_companies,
    cards_count
)
SELECT DISTINCT
    bc.user_id,
    (SELECT COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::INTEGER FROM business_cards WHERE user_id = bc.user_id),
    (SELECT COUNT(DISTINCT LOWER(company))::INTEGER FROM business_cards WHERE user_id = bc.user_id),
    (SELECT COUNT(*)::INTEGER FROM business_cards WHERE user_id = bc.user_id)
FROM business_cards bc
ON CONFLICT (user_id) DO UPDATE SET
    scans_this_month = EXCLUDED.scans_this_month,
    unique_companies = EXCLUDED.unique_companies,
    cards_count = EXCLUDED.cards_count,
    last_updated = CURRENT_TIMESTAMP; 