-- Enable RLS on business_cards table
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS read_own_cards ON business_cards;
DROP POLICY IF EXISTS insert_own_cards ON business_cards;
DROP POLICY IF EXISTS update_own_cards ON business_cards;
DROP POLICY IF EXISTS delete_own_cards ON business_cards;

-- Create policies
CREATE POLICY read_own_cards ON business_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_cards ON business_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own_cards ON business_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_cards ON business_cards
  FOR DELETE USING (auth.uid() = user_id); 