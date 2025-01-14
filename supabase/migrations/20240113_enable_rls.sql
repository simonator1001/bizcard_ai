-- Enable RLS on business_cards table
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS read_own_cards ON business_cards;
DROP POLICY IF EXISTS insert_own_cards ON business_cards;
DROP POLICY IF EXISTS update_own_cards ON business_cards;
DROP POLICY IF EXISTS delete_own_cards ON business_cards;

-- Create policies for business_cards
CREATE POLICY read_own_cards ON business_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_cards ON business_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_cards ON business_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_cards ON business_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on user_usage_stats table
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS read_own_usage ON user_usage_stats;
DROP POLICY IF EXISTS insert_own_usage ON user_usage_stats;
DROP POLICY IF EXISTS update_own_usage ON user_usage_stats;
DROP POLICY IF EXISTS delete_own_usage ON user_usage_stats;

-- Create policies for user_usage_stats
CREATE POLICY read_own_usage ON user_usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_usage ON user_usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_usage ON user_usage_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_usage ON user_usage_stats
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS read_own_user ON users;
DROP POLICY IF EXISTS update_own_user ON users;

-- Create policies for users
CREATE POLICY read_own_user ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY update_own_user ON users
  FOR UPDATE USING (auth.uid() = id);