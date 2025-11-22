-- Enable RLS on business_cards table
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own cards
CREATE POLICY read_own_cards ON business_cards
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own cards
CREATE POLICY insert_own_cards ON business_cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own cards
CREATE POLICY update_own_cards ON business_cards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own cards
CREATE POLICY delete_own_cards ON business_cards
    FOR DELETE
    USING (auth.uid() = user_id); 