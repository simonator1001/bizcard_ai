#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Supabase Debug Script${NC}"
echo "This script will help diagnose issues with Supabase in Coolify"
echo "=====================================================\n"

# Check if we have curl installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    exit 1
fi

# Check Kong service
echo -e "${YELLOW}Checking Kong API Gateway...${NC}"
if curl -s -I "http://localhost:8000/" > /dev/null; then
    echo -e "${GREEN}Kong API is accessible${NC}"
else
    echo -e "${RED}Kong API is not accessible${NC}"
    echo "Checking if Kong container is running..."
    if coolify container status kong; then
        echo "Kong container is running. Checking logs..."
        coolify container logs kong
    else
        echo -e "${RED}Kong container is not running${NC}"
    fi
fi

# Check Auth service
echo -e "\n${YELLOW}Checking Auth Service...${NC}"
if curl -s "http://localhost:9999/health" > /dev/null; then
    echo -e "${GREEN}Auth service is accessible${NC}"
else
    echo -e "${RED}Auth service is not accessible${NC}"
    echo "Checking if Auth container is running..."
    if coolify container status auth; then
        echo "Auth container is running. Checking logs..."
        coolify container logs auth
    else
        echo -e "${RED}Auth container is not running${NC}"
    fi
fi

echo -e "\n${YELLOW}Checking network connectivity between services...${NC}"
# This would need to be run inside the containers, so providing instructions:
echo "To check network connectivity from inside containers:"
echo "1. coolify shell <container> - to access shell"
echo "2. Install necessary tools: apt-get update && apt-get install -y curl"
echo "3. Test connectivity: curl -v http://supabase-auth:9999/health"

echo -e "\n${YELLOW}Checking environment variables...${NC}"
echo "Key environment variables that should be set:"
echo "- POSTGRES_PASSWORD: Check if set"
echo "- SERVICE_PASSWORD_JWT: Check if set"
echo "- SERVICE_SUPABASEANON_KEY: Check if set" 
echo "- SERVICE_SUPABASESERVICE_KEY: Check if set"
echo "- SERVICE_FQDN_SUPABASEKONG: Check if set"

echo -e "\n${YELLOW}Recommendations:${NC}"
echo "1. Check if any services are using the same ports"
echo "2. Verify the SERVICE_FQDN_SUPABASEKONG is correctly set to your domain"
echo "3. Check for firewall or network policy issues"
echo "4. Inspect Kong and GoTrue logs for specific errors"
echo "5. Consider simplifying configuration for initial setup"

echo -e "\n${GREEN}Debug script completed${NC}" 