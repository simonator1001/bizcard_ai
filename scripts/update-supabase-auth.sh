#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Updating Supabase Auth Configuration..."

# Update auth settings
curl -X PATCH "$NEXT_PUBLIC_SUPABASE_URL/dashboard/v1/auth/config" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "https://bizcard.simon-gpt.com",
    "additional_redirect_urls": [
      "https://bizcard.simon-gpt.com/auth/callback",
      "https://bizcard.simon-gpt.com/auth/v1/callback",
      "https://supabase.simon-gpt.com/auth/callback",
      "https://supabase.simon-gpt.com/auth/v1/callback",
      "http://localhost:3000/auth/callback",
      "http://localhost:3000/auth/v1/callback"
    ],
    "jwt_exp": 3600,
    "enable_refresh_token_rotation": true,
    "refresh_token_reuse_interval": 10,
    "mailer_autoconfirm": true
  }'

echo -e "\nVerifying current configuration..."

# Get current configuration
curl "$NEXT_PUBLIC_SUPABASE_URL/dashboard/v1/auth/config" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

echo -e "\n\nUpdating Google OAuth Provider..."

# Update Google OAuth provider
curl -X PATCH "$NEXT_PUBLIC_SUPABASE_URL/dashboard/v1/auth/providers/google" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "client_id": "859959789432-2kae8tn3c94k4np401hscau3k1kk2l29.apps.googleusercontent.com",
    "secret": "'$GOOGLE_CLIENT_SECRET'",
    "redirect_uri": "https://supabase.simon-gpt.com/auth/v1/callback"
  }' 
