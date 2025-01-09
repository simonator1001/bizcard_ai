-- Add lastModified column with default value
ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS "lastModified" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to use updated_at as lastModified
UPDATE public.business_cards
SET "lastModified" = updated_at
WHERE "lastModified" IS NULL;

-- Add trigger to automatically update lastModified
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW."lastModified" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_cards_last_modified ON public.business_cards;
CREATE TRIGGER update_business_cards_last_modified
    BEFORE UPDATE ON public.business_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_last_modified(); 