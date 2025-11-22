#!/bin/bash

# Helper script to extract Supabase keys from open-source/Coolify setup
# This works differently from the managed Supabase service

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Extract Supabase Keys (Open-Source)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

SUPABASE_URL="${1:-https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com}"

echo -e "${YELLOW}Your Supabase URL:${NC} $SUPABASE_URL"
echo ""

# Method 1: Try to extract from Docker containers (if on VPS/local with Docker)
echo -e "${CYAN}Method 1: Extracting from Docker containers...${NC}"
echo ""

if command -v docker &> /dev/null; then
    # Find Supabase containers
    SUPABASE_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -i supabase | head -5)
    
    if [ -n "$SUPABASE_CONTAINERS" ]; then
        echo -e "${GREEN}Found Supabase containers:${NC}"
        echo "$SUPABASE_CONTAINERS" | while read -r container; do
            echo "  - $container"
        done
        echo ""
        
        # Try to get keys from supabase-studio or supabase-kong container
        STUDIO_CONTAINER=$(echo "$SUPABASE_CONTAINERS" | grep -i studio | head -1)
        KONG_CONTAINER=$(echo "$SUPABASE_CONTAINERS" | grep -i kong | head -1)
        
        if [ -n "$STUDIO_CONTAINER" ]; then
            echo -e "${BLUE}Extracting keys from $STUDIO_CONTAINER...${NC}"
            
            # Get environment variables
            ANON_KEY=$(docker exec "$STUDIO_CONTAINER" env 2>/dev/null | grep "SUPABASE_ANON_KEY" | cut -d'=' -f2- | head -1)
            SERVICE_KEY=$(docker exec "$STUDIO_CONTAINER" env 2>/dev/null | grep "SUPABASE_SERVICE_KEY" | cut -d'=' -f2- | head -1)
            PUBLIC_URL=$(docker exec "$STUDIO_CONTAINER" env 2>/dev/null | grep "SUPABASE_PUBLIC_URL" | cut -d'=' -f2- | head -1)
            
            if [ -n "$ANON_KEY" ] && [ -n "$SERVICE_KEY" ]; then
                echo -e "${GREEN}✓ Successfully extracted keys!${NC}"
                echo ""
                echo -e "${CYAN}Your Supabase Configuration:${NC}"
                echo ""
                echo "export SUPABASE_URL='${PUBLIC_URL:-$SUPABASE_URL}'"
                echo "export SUPABASE_ANON_KEY='$ANON_KEY'"
                echo "export SUPABASE_SERVICE_ROLE_KEY='$SERVICE_KEY'"
                echo ""
                echo -e "${YELLOW}Run these commands, then execute:${NC}"
                echo "${GREEN}./scripts/configure-coolify-supabase.sh${NC}"
                echo ""
                exit 0
            fi
        fi
        
        if [ -n "$KONG_CONTAINER" ]; then
            echo -e "${BLUE}Extracting keys from $KONG_CONTAINER...${NC}"
            
            ANON_KEY=$(docker exec "$KONG_CONTAINER" env 2>/dev/null | grep "SUPABASE_ANON_KEY" | cut -d'=' -f2- | head -1)
            SERVICE_KEY=$(docker exec "$KONG_CONTAINER" env 2>/dev/null | grep "SUPABASE_SERVICE_KEY" | cut -d'=' -f2- | head -1)
            
            if [ -n "$ANON_KEY" ] && [ -n "$SERVICE_KEY" ]; then
                echo -e "${GREEN}✓ Successfully extracted keys!${NC}"
                echo ""
                echo -e "${CYAN}Your Supabase Configuration:${NC}"
                echo ""
                echo "export SUPABASE_URL='$SUPABASE_URL'"
                echo "export SUPABASE_ANON_KEY='$ANON_KEY'"
                echo "export SUPABASE_SERVICE_ROLE_KEY='$SERVICE_KEY'"
                echo ""
                echo -e "${YELLOW}Run these commands, then execute:${NC}"
                echo "${GREEN}./scripts/configure-coolify-supabase.sh${NC}"
                echo ""
                exit 0
            fi
        fi
        
        echo -e "${YELLOW}⚠ Could not extract keys from containers automatically${NC}"
        echo ""
    else
        echo -e "${YELLOW}No Supabase containers found running${NC}"
        echo ""
    fi
else
    echo -e "${YELLOW}Docker not available${NC}"
    echo ""
fi

# Method 2: Try to get from Coolify environment (if accessible via API or file)
echo -e "${CYAN}Method 2: Checking Coolify environment...${NC}"
echo ""

# Check for common Coolify environment file locations
COOLIFY_ENV_LOCATIONS=(
    "/data/coolify/.env"
    "/app/.env"
    "/root/.env"
    "$HOME/.env"
    "./.env"
    "../.env"
)

for env_file in "${COOLIFY_ENV_LOCATIONS[@]}"; do
    if [ -f "$env_file" ] && grep -q "SERVICE_SUPABASE" "$env_file" 2>/dev/null; then
        echo -e "${GREEN}Found environment file: $env_file${NC}"
        
        ANON_KEY=$(grep "SERVICE_SUPABASEANON_KEY" "$env_file" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | head -1)
        SERVICE_KEY=$(grep "SERVICE_SUPABASESERVICE_KEY" "$env_file" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | head -1)
        FQDN=$(grep "SERVICE_FQDN_SUPABASEKONG" "$env_file" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | head -1)
        
        if [ -n "$ANON_KEY" ] && [ -n "$SERVICE_KEY" ]; then
            echo -e "${GREEN}✓ Successfully extracted keys from $env_file!${NC}"
            echo ""
            echo -e "${CYAN}Your Supabase Configuration:${NC}"
            echo ""
            echo "export SUPABASE_URL='${FQDN:-$SUPABASE_URL}'"
            echo "export SUPABASE_ANON_KEY='$ANON_KEY'"
            echo "export SUPABASE_SERVICE_ROLE_KEY='$SERVICE_KEY'"
            echo ""
            echo -e "${YELLOW}Run these commands, then execute:${NC}"
            echo "${GREEN}./scripts/configure-coolify-supabase.sh${NC}"
            echo ""
            exit 0
        fi
    fi
done

# Method 3: Try to get from Supabase Studio API (if accessible)
echo -e "${CYAN}Method 3: Trying Supabase Studio API...${NC}"
echo ""

# Try to get keys from the Studio API endpoint
STUDIO_API_URL="${SUPABASE_URL}/api/profile"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STUDIO_API_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}Supabase Studio is accessible${NC}"
    echo -e "${YELLOW}Note: Keys are not exposed via API for security reasons${NC}"
    echo ""
else
    echo -e "${YELLOW}Supabase Studio API not accessible (HTTP $HTTP_CODE)${NC}"
    echo ""
fi

# Method 4: Manual instructions
echo -e "${CYAN}Method 4: Manual Extraction (Recommended)${NC}"
echo ""
echo -e "${BLUE}Since automatic extraction didn't work, here's how to get your keys manually:${NC}"
echo ""

echo -e "${YELLOW}Option A: From Coolify Dashboard${NC}"
echo ""
echo "1. Open your Coolify dashboard"
echo "2. Navigate to your Supabase service/resource"
echo "3. Go to 'Environment Variables' or 'Settings'"
echo "4. Look for these variables:"
echo "   ${GREEN}SERVICE_SUPABASEANON_KEY${NC} → This is your Anon Key"
echo "   ${GREEN}SERVICE_SUPABASESERVICE_KEY${NC} → This is your Service Role Key"
echo "   ${GREEN}SERVICE_FQDN_SUPABASEKONG${NC} → This is your Supabase URL"
echo ""

echo -e "${YELLOW}Option B: From Docker Container (if you have SSH access)${NC}"
echo ""
echo "1. SSH into your VPS/server where Coolify is running"
echo "2. Find the Supabase container:"
echo "   ${GREEN}docker ps | grep supabase${NC}"
echo ""
echo "3. Extract environment variables:"
echo "   ${GREEN}docker exec <container-name> env | grep SUPABASE${NC}"
echo ""
echo "   Or specifically:"
echo "   ${GREEN}docker exec <container-name> env | grep SERVICE_SUPABASEANON_KEY${NC}"
echo "   ${GREEN}docker exec <container-name> env | grep SERVICE_SUPABASESERVICE_KEY${NC}"
echo ""

echo -e "${YELLOW}Option C: From Supabase Studio (if accessible)${NC}"
echo ""
echo "1. Open Supabase Studio:"
echo "   ${GREEN}$SUPABASE_URL/project/default${NC}"
echo ""
echo "2. If Studio loads, you can find keys in:"
echo "   - Settings → API (if available in open-source version)"
echo "   - Or check the browser's developer console → Network tab"
echo "   - Look for API requests that include the keys in headers"
echo ""

echo -e "${YELLOW}Option D: From Database (Advanced)${NC}"
echo ""
echo "If you have database access:"
echo "1. Connect to your Supabase PostgreSQL database"
echo "2. Query the auth schema:"
echo "   ${GREEN}SELECT * FROM auth.config;${NC}"
echo "3. Keys might be in environment or config tables"
echo ""

echo -e "${BLUE}After Getting Your Keys:${NC}"
echo ""
echo "Run the configuration script:"
echo ""
echo "${GREEN}export SUPABASE_URL='$SUPABASE_URL'${NC}"
echo "${GREEN}export SUPABASE_ANON_KEY='your-anon-key'${NC}"
echo "${GREEN}export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'${NC}"
echo "${GREEN}./scripts/configure-coolify-supabase.sh${NC}"
echo ""

echo -e "${RED}Important:${NC}"
echo "  - The ${CYAN}SERVICE_SUPABASESERVICE_KEY${NC} is SECRET - keep it safe!"
echo "  - The ${CYAN}SERVICE_SUPABASEANON_KEY${NC} is public and safe for client-side use"
echo ""
