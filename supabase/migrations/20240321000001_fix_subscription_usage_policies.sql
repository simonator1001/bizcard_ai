-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON subscription_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON subscription_usage;
DROP POLICY IF EXISTS "Service role can manage all usage" ON subscription_usage;

-- Create subscription_usage table if it doesn't exist
DROP TABLE IF EXISTS subscription_usage;
CREATE TABLE subscription_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  scans_count INTEGER DEFAULT 0,
  companies_tracked INTEGER DEFAULT 0,
  total_cards INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, month)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_usage_updated_at
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON subscription_usage TO service_role;
GRANT SELECT, INSERT, UPDATE ON subscription_usage TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Enable RLS
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage"
ON subscription_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON subscription_usage FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON subscription_usage FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage"
ON subscription_usage FOR ALL TO service_role
USING (true);

-- Insert a test record using service role (this should work regardless of RLS)
INSERT INTO subscription_usage (user_id, month, scans_count)
SELECT '59e6e6b7-3ffd-4141-bd18-1e6d00de41c9', DATE_TRUNC('month', CURRENT_DATE), 0
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_usage 
    WHERE user_id = '59e6e6b7-3ffd-4141-bd18-1e6d00de41c9' 
    AND month = DATE_TRUNC('month', CURRENT_DATE)
); 