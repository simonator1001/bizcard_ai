-- Create tracked_companies table
CREATE TABLE IF NOT EXISTS tracked_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_website TEXT,
    industry TEXT,
    importance_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracking_preferences table
CREATE TABLE IF NOT EXISTS tracking_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES tracked_companies(id) ON DELETE CASCADE,
    notification_frequency TEXT DEFAULT 'daily',
    news_categories TEXT[] DEFAULT '{}',
    alert_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    source TEXT NOT NULL,
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    categories TEXT[] DEFAULT '{}',
    related_companies TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_news_alerts table
CREATE TABLE IF NOT EXISTS user_news_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracked_companies_user_id ON tracked_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_preferences_company_id ON tracking_preferences(company_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_categories ON news_articles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_news_articles_related_companies ON news_articles USING GIN(related_companies);
CREATE INDEX IF NOT EXISTS idx_user_news_alerts_user_id ON user_news_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_news_alerts_article_id ON user_news_alerts(article_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tracked_companies_updated_at
    BEFORE UPDATE ON tracked_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracking_preferences_updated_at
    BEFORE UPDATE ON tracking_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE tracked_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_news_alerts ENABLE ROW LEVEL SECURITY;

-- Tracked companies policies
CREATE POLICY "Users can view their own tracked companies"
    ON tracked_companies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked companies"
    ON tracked_companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked companies"
    ON tracked_companies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked companies"
    ON tracked_companies FOR DELETE
    USING (auth.uid() = user_id);

-- Tracking preferences policies
CREATE POLICY "Users can view their own tracking preferences"
    ON tracking_preferences FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM tracked_companies
        WHERE tracked_companies.id = tracking_preferences.company_id
        AND tracked_companies.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own tracking preferences"
    ON tracking_preferences FOR ALL
    USING (EXISTS (
        SELECT 1 FROM tracked_companies
        WHERE tracked_companies.id = tracking_preferences.company_id
        AND tracked_companies.user_id = auth.uid()
    ));

-- News articles policies (public read, admin write)
CREATE POLICY "Anyone can view news articles"
    ON news_articles FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify news articles"
    ON news_articles FOR ALL
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- User news alerts policies
CREATE POLICY "Users can view their own news alerts"
    ON user_news_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own news alerts"
    ON user_news_alerts FOR ALL
    USING (auth.uid() = user_id); 