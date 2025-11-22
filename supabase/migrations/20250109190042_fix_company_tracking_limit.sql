-- First add the new column to the business_cards table
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS increment_company_count BOOLEAN DEFAULT true;

-- Update the trigger function to respect the increment_company_count flag
CREATE OR REPLACE FUNCTION public.update_user_stats_on_card_insert()
RETURNS TRIGGER AS $$
DECLARE
  company_name TEXT;
  is_new_company BOOLEAN;
  increment_company BOOLEAN;
BEGIN
  -- Extract company name
  company_name := COALESCE(NEW.company, NEW.company_zh, '');
  
  -- Check whether to increment company count (use the flag if available)
  increment_company := COALESCE(NEW.increment_company_count, company_name <> '');
  
  -- Check if company exists for this user
  SELECT NOT EXISTS(
    SELECT 1 FROM business_cards 
    WHERE user_id = NEW.user_id 
    AND id <> NEW.id
    AND (
      (company IS NOT NULL AND company = company_name) 
      OR (company_zh IS NOT NULL AND company_zh = company_name)
    )
  ) INTO is_new_company;
  
  -- Get current stats
  UPDATE public.user_usage_stats
  SET 
    cards_count = COALESCE(cards_count, 0) + 1,
    -- Only increment if it's a new company and we should increment
    unique_companies = CASE 
      WHEN is_new_company AND increment_company AND company_name <> '' 
      THEN COALESCE(unique_companies, 0) + 1
      ELSE COALESCE(unique_companies, 0)
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- If no stats record exists yet, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_usage_stats (
      user_id, 
      cards_count, 
      unique_companies,
      updated_at
    ) VALUES (
      NEW.user_id, 
      1, 
      CASE WHEN is_new_company AND increment_company AND company_name <> '' THEN 1 ELSE 0 END,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_user_stats_on_card_insert ON business_cards;
CREATE TRIGGER update_user_stats_on_card_insert
AFTER INSERT ON business_cards
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_card_insert();

-- Create a function to check if user can insert card with company
CREATE OR REPLACE FUNCTION public.can_insert_business_card()
RETURNS TRIGGER AS $$
DECLARE
  company_name TEXT;
  is_new_company BOOLEAN;
  increment_company BOOLEAN;
  user_tier TEXT;
  max_companies INTEGER;
  current_companies INTEGER;
BEGIN
  -- Extract company name
  company_name := COALESCE(NEW.company, NEW.company_zh, '');
  
  -- Check whether to increment company count (use the flag if available)
  increment_company := COALESCE(NEW.increment_company_count, company_name <> '');
  
  -- If we're not incrementing company count, just allow the insert
  IF NOT increment_company OR company_name = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check if company exists for this user
  SELECT NOT EXISTS(
    SELECT 1 FROM business_cards 
    WHERE user_id = NEW.user_id 
    AND id <> NEW.id
    AND (
      (company IS NOT NULL AND company = company_name) 
      OR (company_zh IS NOT NULL AND company_zh = company_name)
    )
  ) INTO is_new_company;
  
  -- If not a new company, no need to check limits
  IF NOT is_new_company THEN
    RETURN NEW;
  END IF;
  
  -- Get user's subscription tier
  SELECT tier INTO user_tier FROM subscriptions WHERE user_id = NEW.user_id;
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Set max companies based on tier
  CASE 
    WHEN user_tier = 'free' THEN max_companies := 3;
    WHEN user_tier = 'basic' THEN max_companies := 10;
    WHEN user_tier = 'pro' THEN max_companies := 2147483647; -- "unlimited"
    ELSE max_companies := 3; -- default to free
  END CASE;
  
  -- Get current company count
  SELECT COALESCE(unique_companies, 0) INTO current_companies
  FROM user_usage_stats
  WHERE user_id = NEW.user_id;
  
  -- Enforce limit
  IF current_companies >= max_companies THEN
    RAISE EXCEPTION 'Company tracking limit reached for current subscription tier';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the BEFORE INSERT trigger to check limits
DROP TRIGGER IF EXISTS check_company_limit_before_insert ON business_cards;
CREATE TRIGGER check_company_limit_before_insert
BEFORE INSERT ON business_cards
FOR EACH ROW
EXECUTE FUNCTION can_insert_business_card(); 