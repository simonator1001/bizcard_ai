# Fixing Row Level Security (RLS) in Supabase

This guide will help you fix the RLS policies for your BizCard application, which should resolve the authentication issues with business card scanning.

## Instructions

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Paste the following SQL commands and execute them

```sql
-- Step 1: Create the user_usage_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  scans_this_month INTEGER DEFAULT 0,
  unique_companies INTEGER DEFAULT 0,
  cards_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_usage_stats_user_id_key UNIQUE (user_id)
);

-- Step 2: Enable RLS on the business_cards table
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Step 3: Enable RLS on the user_usage_stats table
ALTER TABLE public.user_usage_stats ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can insert their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can update their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can delete their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Service role can access all business cards" ON public.business_cards;

-- Step 5: Create policies for business_cards table
-- Allow users to select their own business cards
CREATE POLICY "Users can view their own business cards"
ON public.business_cards
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own business cards
CREATE POLICY "Users can insert their own business cards"
ON public.business_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own business cards
CREATE POLICY "Users can update their own business cards"
ON public.business_cards
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own business cards
CREATE POLICY "Users can delete their own business cards"
ON public.business_cards
FOR DELETE
USING (auth.uid() = user_id);

-- Create service role policy for business_cards
CREATE POLICY "Service role can access all business cards"
ON public.business_cards
USING (true)
WITH CHECK (true);

-- Step 6: Create policies for user_usage_stats table
DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.user_usage_stats;
DROP POLICY IF EXISTS "Service role can manage usage stats" ON public.user_usage_stats;

-- Allow users to select their own usage stats
CREATE POLICY "Users can view their own usage stats"
ON public.user_usage_stats
FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role to manage usage stats
CREATE POLICY "Service role can manage usage stats"
ON public.user_usage_stats
USING (true)
WITH CHECK (true);

-- Step 7: Handle any duplicate records and initialize user usage stats
DO $$
BEGIN
  -- If table already has data, handle existing duplicates if any
  IF EXISTS (
    SELECT user_id, COUNT(*) 
    FROM public.user_usage_stats 
    GROUP BY user_id 
    HAVING COUNT(*) > 1
  ) THEN
    -- Delete duplicates keeping only the most recent record for each user
    DELETE FROM public.user_usage_stats
    WHERE id IN (
      SELECT id FROM (
        SELECT id, user_id, 
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as row_num
        FROM public.user_usage_stats
      ) t
      WHERE t.row_num > 1
    );
  END IF;
END $$;

-- Now insert usage stats for any users without them
INSERT INTO public.user_usage_stats (user_id, scans_this_month, unique_companies, cards_count)
SELECT 
  id as user_id,
  0 as scans_this_month,
  0 as unique_companies,
  0 as cards_count
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_usage_stats)
ON CONFLICT (user_id) DO NOTHING;
```

## Common Errors and Solutions

### Error: "There is no unique or exclusion constraint matching the ON CONFLICT specification"

If you encounter this error, it means the `user_id` column in the `user_usage_stats` table doesn't have a unique constraint. The script above already adds this constraint, but if you need to add it manually:

```sql
-- Add unique constraint to user_id column
ALTER TABLE public.user_usage_stats ADD CONSTRAINT user_usage_stats_user_id_key UNIQUE (user_id);
```

## Verification

After running these commands, you should verify that the RLS policies are correctly set up by:

1. Go to the Authentication section in Supabase
2. Navigate to Policies
3. You should see policies for both `business_cards` and `user_usage_stats` tables

## Testing

To test if the issue has been resolved:

1. Restart your application
2. Log in with a valid user account
3. Try scanning a business card
4. The scan should now complete without authentication errors

If you still encounter issues, please check the console logs for more specific error messages. 