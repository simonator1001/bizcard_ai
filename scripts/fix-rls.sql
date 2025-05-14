-- Script to fix RLS policies for business card tables
-- Run this in the Supabase SQL editor

-- Create the user_usage_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scans_this_month INTEGER DEFAULT 0,
  unique_companies INTEGER DEFAULT 0,
  cards_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the business_cards table
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the user_usage_stats table
ALTER TABLE public.user_usage_stats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the subscriptions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can insert their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can update their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can delete their own business cards" ON public.business_cards;
DROP POLICY IF EXISTS "Service role can access all business cards" ON public.business_cards;

-- Create policies for business_cards table
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

-- Create policies for user_usage_stats table
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

-- Fix subscriptions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions';
    EXECUTE 'CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Initialize the user_usage_stats for existing users if needed
INSERT INTO public.user_usage_stats (user_id, scans_this_month, unique_companies, cards_count)
SELECT 
  id as user_id,
  0 as scans_this_month,
  0 as unique_companies,
  0 as cards_count
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_usage_stats)
ON CONFLICT (user_id) DO NOTHING; 