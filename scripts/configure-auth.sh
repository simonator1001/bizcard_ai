#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Configuring Supabase Auth Settings..."

# Set auth configuration using the management API
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/config" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "https://bizcard.simon-gpt.com",
    "additional_redirect_urls": [
      "https://bizcard.simon-gpt.com",
      "https://bizcard.simon-gpt.com/auth/callback",
      "https://bizcard.simon-gpt.com/signin"
    ],
    "jwt_exp": 3600,
    "enable_refresh_token_rotation": true,
    "refresh_token_reuse_interval": 10
  }')

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}Successfully updated auth configuration${NC}"
else
  echo -e "${RED}Failed to update auth configuration${NC}"
  echo "Status Code: $HTTP_STATUS"
  echo "Response: $BODY"
  exit 1
fi

echo "Verifying configuration..."

# Verify configuration using the management API
RESPONSE=$(curl -s -w "\n%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/config" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}Current configuration:${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}Failed to fetch configuration${NC}"
  echo "Status Code: $HTTP_STATUS"
  echo "Response: $BODY"
  exit 1
fi

# Configure Google OAuth provider
echo "Configuring Google OAuth provider..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/providers/google" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "client_id": "859959789432-2kae8tn3c94k4np401hscau3k1kk2l29.apps.googleusercontent.com",
    "secret": "'$GOOGLE_CLIENT_SECRET'",
    "redirect_uri": "https://bizcard.simon-gpt.com/auth/callback"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}Successfully configured Google OAuth provider${NC}"
else
  echo -e "${RED}Failed to configure Google OAuth provider${NC}"
  echo "Status Code: $HTTP_STATUS"
  echo "Response: $BODY"
  exit 1
fi 
