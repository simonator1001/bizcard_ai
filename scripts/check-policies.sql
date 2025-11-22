-- Check RLS policies for business_cards table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'business_cards';

-- Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'business_cards';

-- Check current user and role
SELECT current_user, session_user, current_setting('role'); 