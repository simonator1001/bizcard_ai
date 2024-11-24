-- Create enum for card categories
CREATE TYPE card_category AS ENUM ('Partner', 'Client', 'Vendor', 'Other');

-- Create business_cards table
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_cards_updated_at
    BEFORE UPDATE ON business_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 