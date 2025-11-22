-- Function to enable RLS on business_cards table
CREATE OR REPLACE FUNCTION enable_rls_on_business_cards()
RETURNS void AS $$
BEGIN
  ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create read policy
CREATE OR REPLACE FUNCTION create_read_policy()
RETURNS void AS $$
BEGIN
  DROP POLICY IF EXISTS read_own_cards ON business_cards;
  CREATE POLICY read_own_cards ON business_cards
    FOR SELECT
    USING (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create insert policy
CREATE OR REPLACE FUNCTION create_insert_policy()
RETURNS void AS $$
BEGIN
  DROP POLICY IF EXISTS insert_own_cards ON business_cards;
  CREATE POLICY insert_own_cards ON business_cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create update policy
CREATE OR REPLACE FUNCTION create_update_policy()
RETURNS void AS $$
BEGIN
  DROP POLICY IF EXISTS update_own_cards ON business_cards;
  CREATE POLICY update_own_cards ON business_cards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create delete policy
CREATE OR REPLACE FUNCTION create_delete_policy()
RETURNS void AS $$
BEGIN
  DROP POLICY IF EXISTS delete_own_cards ON business_cards;
  CREATE POLICY delete_own_cards ON business_cards
    FOR DELETE
    USING (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 