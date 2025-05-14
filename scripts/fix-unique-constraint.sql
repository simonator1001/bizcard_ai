-- Script to fix the unique constraint issue on user_usage_stats table
-- Run this in the Supabase SQL editor if you encounter the error:
-- "ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- First, remove any duplicate records if they exist
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_usage_stats'
  ) THEN
    -- If table has data, find and remove duplicates
    IF EXISTS (
      SELECT user_id, COUNT(*) 
      FROM public.user_usage_stats 
      GROUP BY user_id 
      HAVING COUNT(*) > 1
    ) THEN
      -- Log that we found duplicates
      RAISE NOTICE 'Found duplicates in user_usage_stats table - cleaning up';
      
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
    
    -- Check if unique constraint already exists to avoid errors
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.conname = 'user_usage_stats_user_id_key'
      AND n.nspname = 'public'
    ) THEN
      -- Add unique constraint to user_id
      ALTER TABLE public.user_usage_stats ADD CONSTRAINT user_usage_stats_user_id_key UNIQUE (user_id);
      RAISE NOTICE 'Added unique constraint on user_id column';
    ELSE
      RAISE NOTICE 'Unique constraint on user_id already exists';
    END IF;
  ELSE
    -- If table doesn't exist, create it with the unique constraint
    CREATE TABLE IF NOT EXISTS public.user_usage_stats (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE,
      scans_this_month INTEGER DEFAULT 0,
      unique_companies INTEGER DEFAULT 0,
      cards_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT user_usage_stats_user_id_key UNIQUE (user_id)
    );
    RAISE NOTICE 'Created user_usage_stats table with unique constraint';
  END IF;
END $$;

-- Now try to insert again with ON CONFLICT handling
INSERT INTO public.user_usage_stats (user_id, scans_this_month, unique_companies, cards_count)
SELECT 
  id as user_id,
  0 as scans_this_month,
  0 as unique_companies,
  0 as cards_count
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_usage_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'User usage stats initialization complete';
END $$; 