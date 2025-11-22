-- Add last_modified column
ALTER TABLE business_cards ADD COLUMN last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add merged_from column to store IDs of merged cards
ALTER TABLE business_cards ADD COLUMN merged_from TEXT[] DEFAULT '{}';

-- Create function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_modified
CREATE TRIGGER update_business_cards_last_modified
    BEFORE UPDATE ON business_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

-- Add index on email for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_business_cards_email ON business_cards (email);

-- Add RLS policies for the new columns
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards' last_modified"
    ON business_cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards' last_modified"
    ON business_cards FOR UPDATE
    USING (auth.uid() = user_id);