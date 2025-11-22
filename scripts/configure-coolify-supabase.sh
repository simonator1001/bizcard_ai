#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Coolify Supabase Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export SUPABASE_URL='https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com'"
    echo "  export SUPABASE_ANON_KEY='your-anon-key-here'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'"
    echo ""
    echo "Or run this script with:"
    echo "  SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... ./scripts/configure-coolify-supabase.sh"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables provided${NC}"
echo ""

# Validate URL format
if [[ ! "$SUPABASE_URL" =~ ^https?:// ]]; then
    echo -e "${RED}Error: SUPABASE_URL must start with http:// or https://${NC}"
    exit 1
fi

# Remove trailing slash from URL
SUPABASE_URL=$(echo "$SUPABASE_URL" | sed 's:/*$::')

echo -e "${BLUE}Configuration Details:${NC}"
echo "  URL: $SUPABASE_URL"
echo "  Anon Key: ${SUPABASE_ANON_KEY:0:20}..."
echo "  Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# Determine if we're on VPS (has docker) or local
IS_VPS=false
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    IS_VPS=true
    echo -e "${BLUE}Detected VPS environment (Docker available)${NC}"
else
    echo -e "${BLUE}Detected local development environment${NC}"
fi
echo ""

# Step 1: Update .env.local file
echo -e "${YELLOW}Step 1: Updating .env.local file...${NC}"
ENV_FILE=".env.local"

# Create .env.local if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    echo "# Supabase Configuration" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"
fi

# Backup existing .env.local
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✓ Backed up existing .env.local${NC}"
fi

# Update or add Supabase environment variables
if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE"; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" "$ENV_FILE"
        sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" "$ENV_FILE"
        sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" "$ENV_FILE"
        sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" "$ENV_FILE"
        sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY|" "$ENV_FILE"
    fi
else
    # Add new
    echo "" >> "$ENV_FILE"
    echo "# Coolify Supabase Configuration" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> "$ENV_FILE"
    echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> "$ENV_FILE"
fi

echo -e "${GREEN}✓ Updated .env.local${NC}"
echo ""

# Step 2: Test Supabase connection
echo -e "${YELLOW}Step 2: Testing Supabase connection...${NC}"
TEST_URL="${SUPABASE_URL}/rest/v1/"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $SUPABASE_ANON_KEY" "$TEST_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ Supabase URL is reachable (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify Supabase connection (HTTP $HTTP_CODE)${NC}"
    echo "  This might be normal if the endpoint requires authentication"
fi
echo ""

# Step 3: Update VPS environment if on VPS
if [ "$IS_VPS" = true ]; then
    echo -e "${YELLOW}Step 3: Configuring VPS environment...${NC}"
    
    # Check if running in Coolify or Docker Compose
    if [ -f "docker-compose.yml" ] && docker-compose ps 2>/dev/null | grep -q "supabase"; then
        echo -e "${BLUE}Found Docker Compose setup${NC}"
        
        # Update docker-compose.yml environment variables if needed
        # (This is optional - Coolify might manage this differently)
        echo -e "${GREEN}✓ VPS environment detected${NC}"
    else
        echo -e "${BLUE}No local Docker Compose Supabase found - assuming Coolify-managed${NC}"
    fi
    
    # If there's a Next.js app running, we might need to restart it
    echo -e "${BLUE}Note: You may need to restart your Next.js application for changes to take effect${NC}"
    echo ""
fi

# Step 4: Verify code configuration
echo -e "${YELLOW}Step 4: Verifying code configuration...${NC}"

# Check if supabase client files use environment variables correctly
CLIENT_FILES=("lib/supabase-client.ts" "lib/supabase-client-new.ts" "lib/supabase.ts")

for file in "${CLIENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$file"; then
            echo -e "${GREEN}✓ $file uses environment variables correctly${NC}"
        else
            echo -e "${YELLOW}⚠ $file might need manual review${NC}"
        fi
    fi
done
echo ""

# Step 5: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Configuration Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the updated .env.local file"
echo "  2. If on VPS, ensure your Next.js app reads .env.local"
echo "  3. Restart your Next.js application:"
echo "     - Local: npm run dev"
echo "     - VPS: Restart your Coolify service or run: pkill -f 'next dev' && npm run dev"
echo "  4. Test the connection by logging in"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  - Keep your SUPABASE_SERVICE_ROLE_KEY secret!"
echo "  - The .env.local file has been backed up"
echo "  - Verify the connection works before deploying"
echo ""

