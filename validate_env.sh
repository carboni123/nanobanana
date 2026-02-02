#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "NanoBanana Production .env Validation"
echo "========================================="
echo ""

# Load .env file
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found${NC}"
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

# Track validation status
VALIDATION_PASSED=true

# Function to check if variable is set and non-empty
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ $var_name: NOT SET${NC}"
        VALIDATION_PASSED=false
    else
        echo -e "${GREEN}✓ $var_name: SET${NC}"
    fi
}

# Function to check if optional variable is set
check_optional() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}○ $var_name: NOT SET (optional)${NC}"
    else
        echo -e "${GREEN}✓ $var_name: SET${NC}"
    fi
}

echo "REQUIRED Variables:"
echo "-------------------"
check_required "CLOUDFLARED_TOKEN"
check_required "DB_USER"
check_required "DB_PASSWORD"
check_required "REDIS_PASSWORD"
check_required "SECRET_KEY"
check_required "VITE_API_URL"
check_required "ACCESS_TOKEN_EXPIRE_MINUTES"

echo ""
echo "OPTIONAL Variables (for future features):"
echo "------------------------------------------"
check_optional "GOOGLE_API_KEY"
check_optional "R2_ACCESS_KEY"
check_optional "R2_SECRET_KEY"
check_optional "R2_BUCKET"
check_optional "R2_ENDPOINT"

echo ""
echo "========================================="
echo "Validation Details:"
echo "========================================="

# Check password strengths
if [ ${#DB_PASSWORD} -lt 32 ]; then
    echo -e "${YELLOW}⚠ DB_PASSWORD length: ${#DB_PASSWORD} chars (recommended: 32+)${NC}"
else
    echo -e "${GREEN}✓ DB_PASSWORD length: ${#DB_PASSWORD} chars${NC}"
fi

if [ ${#REDIS_PASSWORD} -lt 32 ]; then
    echo -e "${YELLOW}⚠ REDIS_PASSWORD length: ${#REDIS_PASSWORD} chars (recommended: 32+)${NC}"
else
    echo -e "${GREEN}✓ REDIS_PASSWORD length: ${#REDIS_PASSWORD} chars${NC}"
fi

if [ ${#SECRET_KEY} -lt 32 ]; then
    echo -e "${YELLOW}⚠ SECRET_KEY length: ${#SECRET_KEY} chars (recommended: 32+)${NC}"
else
    echo -e "${GREEN}✓ SECRET_KEY length: ${#SECRET_KEY} chars${NC}"
fi

# Check VITE_API_URL format
if [[ $VITE_API_URL =~ ^https?:// ]]; then
    echo -e "${GREEN}✓ VITE_API_URL format: valid URL${NC}"
else
    echo -e "${RED}✗ VITE_API_URL format: invalid (should start with http:// or https://)${NC}"
    VALIDATION_PASSED=false
fi

# Check ACCESS_TOKEN_EXPIRE_MINUTES is a number
if [[ $ACCESS_TOKEN_EXPIRE_MINUTES =~ ^[0-9]+$ ]]; then
    echo -e "${GREEN}✓ ACCESS_TOKEN_EXPIRE_MINUTES: valid number ($ACCESS_TOKEN_EXPIRE_MINUTES minutes = $((ACCESS_TOKEN_EXPIRE_MINUTES/60/24)) days)${NC}"
else
    echo -e "${RED}✗ ACCESS_TOKEN_EXPIRE_MINUTES: invalid (should be a number)${NC}"
    VALIDATION_PASSED=false
fi

echo ""
echo "========================================="
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ VALIDATION PASSED${NC}"
    echo "All required environment variables are properly configured."
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED${NC}"
    echo "Some required environment variables are missing or invalid."
    exit 1
fi
