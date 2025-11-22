-- Combine all checks and creations into a single DO block
DO $MAINBLOCK$ 
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_category') THEN
        CREATE TYPE card_category AS ENUM ('Partner', 'Client', 'Vendor', 'Other');
    END IF;

    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'business_cards') THEN
        CREATE TABLE business_cards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            name_zh TEXT,
            company TEXT NOT NULL,
            company_zh TEXT,
            title TEXT,
            title_zh TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            address_zh TEXT,
            image_url TEXT,
            category card_category DEFAULT 'Other',
            tags TEXT[],
            raw_text TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );

        -- Create RLS policies
        ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own business cards"
            ON business_cards
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own business cards"
            ON business_cards
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own business cards"
            ON business_cards
            FOR UPDATE
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own business cards"
            ON business_cards
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;

    -- Create or replace the updated_at function (always do this to ensure latest version)
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $FUNC1$
    BEGIN
        NEW.updated_at = TIMEZONE('utc', NOW());
        RETURN NEW;
    END;
    $FUNC1$ language 'plpgsql';

    -- Create the updated_at trigger if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_cards_updated_at') THEN
        CREATE TRIGGER update_business_cards_updated_at
            BEFORE UPDATE ON business_cards
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create or replace the scan count function (always do this to ensure latest version)
    CREATE OR REPLACE FUNCTION increment_scan_count()
    RETURNS TRIGGER AS $FUNC2$
    BEGIN
        INSERT INTO subscription_usage (user_id, month, scans_count)
        VALUES (NEW.user_id, date_trunc('month', CURRENT_DATE), 1)
        ON CONFLICT (user_id, month)
        DO UPDATE SET scans_count = subscription_usage.scans_count + 1;
        RETURN NEW;
    END;
    $FUNC2$ LANGUAGE plpgsql;

    -- Create the scan count trigger if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'increment_scan_count_trigger') THEN
        CREATE TRIGGER increment_scan_count_trigger
            AFTER INSERT ON business_cards
            FOR EACH ROW
            EXECUTE FUNCTION increment_scan_count();
    END IF;
END $MAINBLOCK$; 