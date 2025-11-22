-- Function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
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

-- Function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql_statement(statement text)
RETURNS void AS $$
BEGIN
  EXECUTE statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 