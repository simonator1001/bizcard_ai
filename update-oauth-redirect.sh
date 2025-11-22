#!/bin/bash

# Color for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Updating Google OAuth Redirect URI in Supabase..."

# Get Supabase URL from environment
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "Error: Could not find Supabase URL or service role key in .env.local"
    exit 1
fi

echo "Using Supabase URL: $SUPABASE_URL"

# New redirect URI that will be used
NEW_REDIRECT_URI="https://supabasekong-v4co88s4cwwk04ockcg4gok8.simon-gpt.com/auth/v1/callback"

# Update Google OAuth provider configuration
curl -X PUT "$SUPABASE_URL/auth/v1/admin/providers/google" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"redirect_uri\": \"$NEW_REDIRECT_URI\"
  }"

echo -e "\n${GREEN}OAuth redirect URI updated to: $NEW_REDIRECT_URI${NC}"
echo "Now add this same URL to your Google Cloud Console OAuth configuration"
echo "under 'Authorized redirect URIs'." 