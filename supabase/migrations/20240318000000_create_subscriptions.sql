-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_provider TEXT,
    payment_provider_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_usage table to track monthly usage
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    scans_count INTEGER DEFAULT 0,
    companies_tracked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Create RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- Users can only read their own usage
CREATE POLICY "Users can view own usage"
    ON subscription_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update usage
CREATE POLICY "Service role can manage usage"
    ON subscription_usage FOR ALL
    USING (auth.role() = 'service_role');

-- Create function to update usage
CREATE OR REPLACE FUNCTION increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscription_usage (user_id, month, scans_count)
    VALUES (NEW.user_id, date_trunc('month', CURRENT_DATE), 1)
    ON CONFLICT (user_id, month)
    DO UPDATE SET scans_count = subscription_usage.scans_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 