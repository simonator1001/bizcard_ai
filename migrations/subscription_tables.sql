-- Add subscription columns to users table
ALTER TABLE users ADD COLUMN subscription_type TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN card_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN max_cards INTEGER DEFAULT 30;

-- Create subscription_status table
CREATE TABLE subscription_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription_history table
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  previous_plan TEXT,
  new_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 