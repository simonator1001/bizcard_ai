#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Updating Supabase Auth Configuration..."

# Update environment variables
docker exec -i supabase-db psql -U postgres -d postgres << EOF
UPDATE auth.config SET 
    site_url = 'https://bizcard.simon-gpt.com',
    additional_redirect_urls = ARRAY[
        'https://bizcard.simon-gpt.com',
        'https://bizcard.simon-gpt.com/auth/callback',
        'https://bizcard.simon-gpt.com/signin',
        'https://bizcard.simon-gpt.com/signup',
        'http://localhost:3000',
        'http://localhost:3000/auth/callback',
        'http://localhost:3000/signin',
        'http://localhost:3000/signup'
    ],
    jwt_exp = 3600,
    enable_refresh_token_rotation = true,
    refresh_token_reuse_interval = 10;

-- Update cookie settings
UPDATE auth.config SET 
    cookie_options = jsonb_build_object(
        'domain', null,  -- Let the browser set the domain automatically
        'path', '/',
        'secure', true,
        'httpOnly', true,
        'sameSite', 'lax'
    );

-- Update Google OAuth provider
INSERT INTO auth.providers (provider_id, provider_type, enabled, client_id, client_secret, redirect_uri)
VALUES (
    'google',
    'oauth',
    true,
    '859959789432-2kae8tn3c94k4np401hscau3k1kk2l29.apps.googleusercontent.com',
    '$GOOGLE_CLIENT_SECRET',
    'https://bizcard.simon-gpt.com/auth/callback'
)
ON CONFLICT (provider_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    client_id = EXCLUDED.client_id,
    client_secret = EXCLUDED.client_secret,
    redirect_uri = EXCLUDED.redirect_uri;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully updated auth configuration${NC}"
else
    echo -e "${RED}Failed to update auth configuration${NC}"
    exit 1
fi

# Restart auth service
echo "Restarting Supabase Auth service..."
docker restart supabase-auth

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Auth service restarted successfully${NC}"
else
    echo -e "${RED}Failed to restart auth service${NC}"
    exit 1
fi

echo -e "${GREEN}Configuration update completed!${NC}" 