#!/bin/bash

# Advanced script to extract Supabase keys from Coolify environment
# This script tries multiple methods to find the keys automatically

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SUPABASE_URL="${1:-https://supabasekong-r40cw444w88cgocowgo404so.simon-gpt.com}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Coolify Key Extractor${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

FOUND_KEYS=false
ANON_KEY=""
SERVICE_KEY=""
FQDN=""

# Method 1: Check current environment variables
echo -e "${CYAN}[1/5] Checking current environment variables...${NC}"
if [ -n "$SERVICE_SUPABASEANON_KEY" ] && [ -n "$SERVICE_SUPABASESERVICE_KEY" ]; then
    ANON_KEY="$SERVICE_SUPABASEANON_KEY"
    SERVICE_KEY="$SERVICE_SUPABASESERVICE_KEY"
    FQDN="${SERVICE_FQDN_SUPABASEKONG:-$SUPABASE_URL}"
    FOUND_KEYS=true
    echo -e "${GREEN}✓ Found keys in environment variables${NC}"
else
    echo -e "${YELLOW}✗ Not found in current environment${NC}"
fi
echo ""

# Method 2: Check Docker containers
if [ "$FOUND_KEYS" = false ] && command -v docker &> /dev/null; then
    echo -e "${CYAN}[2/5] Checking Docker containers...${NC}"
    
    # Find all Supabase-related containers
    CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -iE "supabase|studio|kong" || true)
    
    if [ -n "$CONTAINERS" ]; then
        echo "Found containers: $(echo "$CONTAINERS" | tr '\n' ' ')"
        
        for container in $CONTAINERS; do
            echo "  Checking $container..."
            
            # Try to get env vars from container
            ENV_OUTPUT=$(docker exec "$container" env 2>/dev/null || true)
            
            if echo "$ENV_OUTPUT" | grep -q "SERVICE_SUPABASEANON_KEY"; then
                ANON_KEY=$(echo "$ENV_OUTPUT" | grep "SERVICE_SUPABASEANON_KEY" | cut -d'=' -f2- | head -1 | tr -d '\r')
            fi
            
            if echo "$ENV_OUTPUT" | grep -q "SERVICE_SUPABASESERVICE_KEY"; then
                SERVICE_KEY=$(echo "$ENV_OUTPUT" | grep "SERVICE_SUPABASESERVICE_KEY" | cut -d'=' -f2- | head -1 | tr -d '\r')
            fi
            
            if echo "$ENV_OUTPUT" | grep -q "SERVICE_FQDN_SUPABASEKONG"; then
                FQDN=$(echo "$ENV_OUTPUT" | grep "SERVICE_FQDN_SUPABASEKONG" | cut -d'=' -f2- | head -1 | tr -d '\r')
            fi
            
            # Also check for SUPABASE_ANON_KEY and SUPABASE_SERVICE_KEY (without SERVICE_ prefix)
            if echo "$ENV_OUTPUT" | grep -q "^SUPABASE_ANON_KEY="; then
                ANON_KEY=$(echo "$ENV_OUTPUT" | grep "^SUPABASE_ANON_KEY=" | cut -d'=' -f2- | head -1 | tr -d '\r')
            fi
            
            if echo "$ENV_OUTPUT" | grep -q "^SUPABASE_SERVICE_KEY="; then
                SERVICE_KEY=$(echo "$ENV_OUTPUT" | grep "^SUPABASE_SERVICE_KEY=" | cut -d'=' -f2- | head -1 | tr -d '\r')
            fi
            
            if [ -n "$ANON_KEY" ] && [ -n "$SERVICE_KEY" ]; then
                FOUND_KEYS=true
                echo -e "${GREEN}✓ Found keys in container: $container${NC}"
                break
            fi
        done
        
        if [ "$FOUND_KEYS" = false ]; then
            echo -e "${YELLOW}✗ Keys not found in containers${NC}"
        fi
    else
        echo -e "${YELLOW}✗ No Supabase containers found${NC}"
    fi
    echo ""
fi

# Method 3: Check common environment file locations
if [ "$FOUND_KEYS" = false ]; then
    echo -e "${CYAN}[3/5] Checking environment files...${NC}"
    
    ENV_FILES=(
        "/data/coolify/.env"
        "/data/coolify/env"
        "/app/.env"
        "/app/env"
        "/root/.env"
        "$HOME/.env"
        "./.env"
        "../.env"
        "/etc/coolify/.env"
    )
    
    for env_file in "${ENV_FILES[@]}"; do
        if [ -f "$env_file" ] && [ -r "$env_file" ]; then
            echo "  Checking $env_file..."
            
            if grep -q "SERVICE_SUPABASE" "$env_file" 2>/dev/null; then
                if [ -z "$ANON_KEY" ]; then
                    ANON_KEY=$(grep "^SERVICE_SUPABASEANON_KEY=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ' | head -1)
                fi
                
                if [ -z "$SERVICE_KEY" ]; then
                    SERVICE_KEY=$(grep "^SERVICE_SUPABASESERVICE_KEY=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ' | head -1)
                fi
                
                if [ -z "$FQDN" ]; then
                    FQDN=$(grep "^SERVICE_FQDN_SUPABASEKONG=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ' | head -1)
                fi
                
                if [ -n "$ANON_KEY" ] && [ -n "$SERVICE_KEY" ]; then
                    FOUND_KEYS=true
                    echo -e "${GREEN}✓ Found keys in: $env_file${NC}"
                    break
                fi
            fi
        fi
    done
    
    if [ "$FOUND_KEYS" = false ]; then
        echo -e "${YELLOW}✗ Keys not found in environment files${NC}"
    fi
    echo ""
fi

# Method 4: Check docker-compose.yml or similar files
if [ "$FOUND_KEYS" = false ]; then
    echo -e "${CYAN}[4/5] Checking docker-compose files...${NC}"
    
    COMPOSE_FILES=(
        "./docker-compose.yml"
        "../docker-compose.yml"
        "/data/coolify/docker-compose.yml"
    )
    
    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            echo "  Checking $compose_file..."
            # Note: docker-compose files usually reference env vars, not contain them
            # But we can check if they reference the right variable names
            if grep -q "SERVICE_SUPABASEANON_KEY" "$compose_file" 2>/dev/null; then
                echo -e "${YELLOW}  ⚠ Found references to keys in compose file${NC}"
                echo -e "${YELLOW}  Keys should be in environment variables, not in compose file${NC}"
            fi
        fi
    done
    echo ""
fi

# Method 5: Try to query Supabase API (keys might be in response headers)
if [ "$FOUND_KEYS" = false ]; then
    echo -e "${CYAN}[5/5] Checking Supabase API...${NC}"
    
    # Try to make a request and check headers
    RESPONSE=$(curl -s -I "${SUPABASE_URL}/rest/v1/" 2>/dev/null || true)
    
    if echo "$RESPONSE" | grep -qi "apikey"; then
        echo -e "${YELLOW}  API is accessible, but keys are not in response headers${NC}"
    else
        echo -e "${YELLOW}  Could not access API or keys not exposed${NC}"
    fi
    echo ""
fi

# Output results
echo -e "${BLUE}========================================${NC}"
if [ "$FOUND_KEYS" = true ] && [ -n "$ANON_KEY" ] && [ -n "$SERVICE_KEY" ]; then
    echo -e "${GREEN}✓ Keys Successfully Extracted!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${CYAN}Your Supabase Configuration:${NC}"
    echo ""
    echo "export SUPABASE_URL='${FQDN:-$SUPABASE_URL}'"
    echo "export SUPABASE_ANON_KEY='$ANON_KEY'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='$SERVICE_KEY'"
    echo ""
    echo -e "${YELLOW}Next step:${NC}"
    echo "${GREEN}./scripts/configure-coolify-supabase.sh${NC}"
    echo ""
    
    # Offer to run the configuration script automatically
    read -p "Do you want to run the configuration script now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        export SUPABASE_URL="${FQDN:-$SUPABASE_URL}"
        export SUPABASE_ANON_KEY="$ANON_KEY"
        export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
        ./scripts/configure-coolify-supabase.sh
    fi
else
    echo -e "${RED}✗ Could not extract keys automatically${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please use manual methods:${NC}"
    echo ""
    echo "1. Check Coolify dashboard → Environment Variables"
    echo "2. Check Docker containers: docker exec <container> env | grep SUPABASE"
    echo "3. Check environment files in /data/coolify/ or /app/"
    echo ""
    echo "Run ${GREEN}./scripts/get-supabase-keys.sh${NC} for detailed instructions"
    echo ""
fi

