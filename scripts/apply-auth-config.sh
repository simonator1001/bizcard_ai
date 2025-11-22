#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Applying Supabase Auth Configuration..."

# Replace environment variables in the config file
CONFIG_FILE="supabase/config/auth.json"
TMP_CONFIG="/tmp/auth_config.json"

# Replace environment variables
cat $CONFIG_FILE | \
  sed "s|\${GOOGLE_CLIENT_SECRET}|$GOOGLE_CLIENT_SECRET|g" > $TMP_CONFIG

# Apply configuration using Docker
docker exec -i supabase_db_1 psql -U postgres -d postgres -c "
  UPDATE auth.config SET 
    site_url = '$(jq -r .site_url $TMP_CONFIG)',
    additional_redirect_urls = '$(jq -r .additional_redirect_urls[] $TMP_CONFIG | paste -sd, -)',
    jwt_exp = $(jq .jwt_exp $TMP_CONFIG),
    enable_refresh_token_rotation = $(jq .enable_refresh_token_rotation $TMP_CONFIG),
    refresh_token_reuse_interval = $(jq .refresh_token_reuse_interval $TMP_CONFIG);"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Successfully updated auth configuration${NC}"
else
  echo -e "${RED}Failed to update auth configuration${NC}"
  exit 1
fi

# Configure Google OAuth provider
docker exec -i supabase_db_1 psql -U postgres -d postgres -c "
  INSERT INTO auth.providers (provider_id, provider_type, enabled, client_id, client_secret, redirect_uri)
  VALUES (
    'google',
    'oauth',
    $(jq '.providers.google.enabled' $TMP_CONFIG),
    '$(jq -r '.providers.google.client_id' $TMP_CONFIG)',
    '$(jq -r '.providers.google.secret' $TMP_CONFIG)',
    '$(jq -r '.providers.google.redirect_uri' $TMP_CONFIG)'
  )
  ON CONFLICT (provider_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    client_id = EXCLUDED.client_id,
    client_secret = EXCLUDED.client_secret,
    redirect_uri = EXCLUDED.redirect_uri;"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Successfully configured Google OAuth provider${NC}"
else
  echo -e "${RED}Failed to configure Google OAuth provider${NC}"
  exit 1
fi

# Clean up
rm $TMP_CONFIG

echo -e "${GREEN}Configuration applied successfully!${NC}"

# Restart auth service to apply changes
echo "Restarting Supabase Auth service..."
docker restart supabase_auth_1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Auth service restarted successfully${NC}"
else
  echo -e "${RED}Failed to restart auth service${NC}"
  exit 1
fi 