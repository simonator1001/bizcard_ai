-- Function to execute SQL statements
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if RLS is enabled for a table
CREATE OR REPLACE FUNCTION check_rls(table_name text)
RETURNS boolean AS $$
DECLARE
  is_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO is_enabled
  FROM pg_class
  WHERE oid = table_name::regclass;
  RETURN is_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get policies for a table
CREATE OR REPLACE FUNCTION get_policies(table_name text)
RETURNS TABLE (
  policyname name,
  permissive text,
  roles name[],
  cmd text,
  qual text,
  with_check text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pol.policyname,
    pol.permissive,
    pol.roles,
    pol.cmd,
    pol.qual,
    pol.with_check
  FROM pg_policy pol
  JOIN pg_class pc ON pol.polrelid = pc.oid
  WHERE pc.relname = table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to alter table and enable RLS
CREATE OR REPLACE FUNCTION alter_table_enable_rls(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create policy
CREATE OR REPLACE FUNCTION create_policy(table_name text, policy_name text, policy_sql text)
RETURNS void AS $$
BEGIN
  EXECUTE policy_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table policies
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
  policyname name,
  permissive text,
  roles name[],
  cmd text,
  qual text,
  with_check text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pol.policyname,
    pol.permissive,
    pol.roles,
    pol.cmd,
    pol.qual,
    pol.with_check
  FROM pg_policy pol
  JOIN pg_class pc ON pol.polrelid = pc.oid
  WHERE pc.relname = table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 