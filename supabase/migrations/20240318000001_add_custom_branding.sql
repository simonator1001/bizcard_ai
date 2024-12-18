-- Add custom branding fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN custom_branding JSONB DEFAULT NULL;

-- Create a trigger to validate custom branding JSON
CREATE OR REPLACE FUNCTION validate_custom_branding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_branding IS NOT NULL THEN
    -- Validate required fields
    IF NOT (NEW.custom_branding ? 'logoUrl') THEN
      RAISE EXCEPTION 'Custom branding must include a logoUrl';
    END IF;
    
    -- Validate optional fields
    IF (NEW.custom_branding ? 'primaryColor') AND 
       NOT (NEW.custom_branding->>'primaryColor' ~ '^#[0-9A-Fa-f]{6}$') THEN
      RAISE EXCEPTION 'primaryColor must be a valid hex color code';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_custom_branding_trigger
BEFORE INSERT OR UPDATE ON subscriptions
FOR EACH ROW
WHEN (NEW.tier = 'enterprise')
EXECUTE FUNCTION validate_custom_branding(); 