#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if environment variables are set
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${RED}Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set${NC}"
    echo "Please run:"
    echo "export GOOGLE_CLIENT_ID=859959789432-2kae8tn3c94k4np401hscau3k1kk2l29.apps.googleusercontent.com"
    echo "export GOOGLE_CLIENT_SECRET=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"
    exit 1
fi

echo "Updating Supabase configuration on VPS..."

# Find the Supabase container ID
SUPABASE_AUTH_CONTAINER=$(docker ps | grep 'supabase-auth' | awk '{print $1}')
SUPABASE_DB_CONTAINER=$(docker ps | grep 'supabase-db' | awk '{print $1}')

if [ -z "$SUPABASE_AUTH_CONTAINER" ] || [ -z "$SUPABASE_DB_CONTAINER" ]; then
    echo -e "${RED}Could not find Supabase containers. Make sure they are running.${NC}"
    exit 1
fi

echo "Found Supabase containers:"
echo "Auth: $SUPABASE_AUTH_CONTAINER"
echo "DB: $SUPABASE_DB_CONTAINER"

# Update auth configuration in the database
echo "Updating auth configuration in database..."
docker exec -i $SUPABASE_DB_CONTAINER psql -U postgres -d postgres << EOF
UPDATE auth.config SET 
    site_url = 'https://bizcard.simon-gpt.com',
    additional_redirect_urls = ARRAY[
        'https://bizcard.simon-gpt.com',
        'https://bizcard.simon-gpt.com/auth/callback',
        'https://bizcard.simon-gpt.com/signin',
        'http://localhost:3000',
        'http://localhost:3000/auth/callback',
        'http://localhost:3000/signin'
    ],
    jwt_exp = 3600,
    enable_refresh_token_rotation = true,
    refresh_token_reuse_interval = 10;

INSERT INTO auth.providers (provider_id, provider_type, enabled, client_id, client_secret, redirect_uri)
VALUES (
    'google',
    'oauth',
    true,
    '$GOOGLE_CLIENT_ID',
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
    echo -e "${GREEN}Successfully updated database configuration${NC}"
else
    echo -e "${RED}Failed to update database configuration${NC}"
    exit 1
fi

# Restart the auth service
echo "Restarting Supabase Auth service..."
docker restart $SUPABASE_AUTH_CONTAINER

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Successfully restarted auth service${NC}"
else
    echo -e "${RED}Failed to restart auth service${NC}"
    exit 1
fi

echo -e "${GREEN}Configuration update completed!${NC}"
echo "Please check the Supabase logs for any errors:"
docker logs $SUPABASE_AUTH_CONTAINER 