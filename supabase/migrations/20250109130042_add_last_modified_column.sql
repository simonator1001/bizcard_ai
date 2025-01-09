-- Add lastModified column with default value
ALTER TABLE business_cards
ADD COLUMN "lastModified" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to use updated_at as lastModified
UPDATE business_cards
SET "lastModified" = updated_at
WHERE "lastModified" IS NULL;

-- Add trigger to automatically update lastModified
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW."lastModified" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_cards_last_modified
    BEFORE UPDATE ON business_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();
