-- Add service role policy for business_cards
DO $MAINBLOCK$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Service role can manage all business cards" ON business_cards;
    DROP POLICY IF EXISTS "Users can insert their own business cards" ON business_cards;
    DROP POLICY IF EXISTS "Users can view their own business cards" ON business_cards;
    DROP POLICY IF EXISTS "Users can update their own business cards" ON business_cards;
    DROP POLICY IF EXISTS "Users can delete their own business cards" ON business_cards;

    -- Create policies for authenticated users
    CREATE POLICY "Users can view their own business cards"
        ON business_cards
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own business cards"
        ON business_cards
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own business cards"
        ON business_cards
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own business cards"
        ON business_cards
        FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);

    -- Create policy for service role
    CREATE POLICY "Service role can manage all business cards"
        ON business_cards
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

    -- Ensure RLS is enabled
    ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
END $MAINBLOCK$; 