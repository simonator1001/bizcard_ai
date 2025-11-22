-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the monthly reset job
SELECT cron.schedule(
    'reset-monthly-usage',  -- job name
    '0 0 1 * *',           -- run at midnight on the 1st of every month
    $$SELECT reset_monthly_usage()$$
); 