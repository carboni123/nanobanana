#!/bin/bash
# Manual Test Script for /v1/generate Endpoint with Real Google Gemini API
# Task 2: Test existing generate endpoint with real Gemini API

set -e

echo "======================================================================"
echo "Manual Test: /v1/generate Endpoint with Real Google Gemini API"
echo "======================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Step 1: Checking prerequisites..."
echo "----------------------------------------------------------------------"

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Warning: Virtual environment not activated. Activating...${NC}"
    source .venv/bin/activate
fi

# Check if Google API key is configured
echo ""
echo "Step 2: Verifying Google API Key configuration..."
echo "----------------------------------------------------------------------"
python verify_gemini_api.py
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}ERROR: Google API key is not properly configured.${NC}"
    echo ""
    echo "To configure:"
    echo "1. Get API key from: https://makersuite.google.com/app/apikey"
    echo "2. Set in .env file or export: export GOOGLE_API_KEY=AIzaSy..."
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Google API key is configured${NC}"
echo ""

# Start the server in background
echo "Step 3: Starting backend server..."
echo "----------------------------------------------------------------------"
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 1
uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/nanobanana_server.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"
echo "Waiting for server to be ready..."
sleep 3

# Function to cleanup
cleanup() {
    echo ""
    echo "Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

# Test if server is running
echo ""
echo "Step 4: Testing server health..."
echo "----------------------------------------------------------------------"
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8000/health)
echo "Health check response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}ERROR: Server health check failed${NC}"
    exit 1
fi

# Create test user
echo ""
echo "Step 5: Creating test user..."
echo "----------------------------------------------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test_'$(date +%s)'@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }')

echo "Register response: $REGISTER_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}ERROR: Failed to create user or extract access token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ User created, access token obtained${NC}"

# Create API key
echo ""
echo "Step 6: Creating API key..."
echo "----------------------------------------------------------------------"
KEY_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/v1/keys \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
        "name": "Manual Test Key"
    }')

echo "API key response: $KEY_RESPONSE"

# Extract API key
API_KEY=$(echo $KEY_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('key', ''))")

if [ -z "$API_KEY" ]; then
    echo -e "${RED}ERROR: Failed to create or extract API key${NC}"
    exit 1
fi

echo -e "${GREEN}✓ API key created: ${API_KEY:0:20}...${NC}"

# Test 1: Generate with minimal parameters (natural style)
echo ""
echo "Step 7: Testing /v1/generate endpoint - Test 1: Natural style"
echo "----------------------------------------------------------------------"
echo "Request payload:"
echo '{
    "prompt": "A cute banana wearing sunglasses on a beach"
}'
echo ""

GEN_RESPONSE_1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://127.0.0.1:8000/v1/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d '{
        "prompt": "A cute banana wearing sunglasses on a beach"
    }')

HTTP_STATUS_1=$(echo "$GEN_RESPONSE_1" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY_1=$(echo "$GEN_RESPONSE_1" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS_1"
echo "Response body:"
echo "$RESPONSE_BODY_1" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY_1"
echo ""

if [ "$HTTP_STATUS_1" -eq 201 ]; then
    echo -e "${GREEN}✓ Test 1 PASSED: Image generated successfully${NC}"

    # Verify response structure
    if echo "$RESPONSE_BODY_1" | grep -q '"id"' && \
       echo "$RESPONSE_BODY_1" | grep -q '"url"' && \
       echo "$RESPONSE_BODY_1" | grep -q '"prompt"' && \
       echo "$RESPONSE_BODY_1" | grep -q '"created_at"'; then
        echo -e "${GREEN}✓ Response contains all required fields (id, url, prompt, created_at)${NC}"
    else
        echo -e "${RED}✗ Response missing required fields${NC}"
    fi

    # Check if URL is base64 or R2 URL
    if echo "$RESPONSE_BODY_1" | grep -q '"url".*"data:image/png;base64'; then
        echo -e "${YELLOW}⚠ Image returned as base64 (R2 not configured)${NC}"
    elif echo "$RESPONSE_BODY_1" | grep -q '"url".*"http'; then
        echo -e "${GREEN}✓ Image stored in R2 storage${NC}"
    fi
else
    echo -e "${RED}✗ Test 1 FAILED: Expected status 201, got $HTTP_STATUS_1${NC}"
fi

# Test 2: Generate with artistic style
echo ""
echo "Step 8: Testing /v1/generate endpoint - Test 2: Artistic style"
echo "----------------------------------------------------------------------"
echo "Request payload:"
echo '{
    "prompt": "A banana in space",
    "size": "1024x1024",
    "style": "artistic"
}'
echo ""

GEN_RESPONSE_2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://127.0.0.1:8000/v1/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d '{
        "prompt": "A banana in space",
        "size": "1024x1024",
        "style": "artistic"
    }')

HTTP_STATUS_2=$(echo "$GEN_RESPONSE_2" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY_2=$(echo "$GEN_RESPONSE_2" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS_2"
echo "Response body:"
echo "$RESPONSE_BODY_2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY_2"
echo ""

if [ "$HTTP_STATUS_2" -eq 201 ]; then
    echo -e "${GREEN}✓ Test 2 PASSED: Image generated with artistic style${NC}"
else
    echo -e "${RED}✗ Test 2 FAILED: Expected status 201, got $HTTP_STATUS_2${NC}"
fi

# Test 3: Verify usage tracking
echo ""
echo "Step 9: Verifying usage tracking..."
echo "----------------------------------------------------------------------"
USAGE_RESPONSE=$(curl -s -X GET http://127.0.0.1:8000/v1/usage/summary \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Usage summary:"
echo "$USAGE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USAGE_RESPONSE"
echo ""

TOTAL_IMAGES=$(echo "$USAGE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('total_images', 0))" 2>/dev/null || echo "0")

if [ "$TOTAL_IMAGES" -ge 2 ]; then
    echo -e "${GREEN}✓ Usage tracking working: $TOTAL_IMAGES images generated${NC}"
else
    echo -e "${YELLOW}⚠ Usage tracking: Expected at least 2 images, got $TOTAL_IMAGES${NC}"
fi

# Summary
echo ""
echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo ""
echo "Test Results:"
echo "  1. Natural style generation: $([ "$HTTP_STATUS_1" -eq 201 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  2. Artistic style generation: $([ "$HTTP_STATUS_2" -eq 201 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  3. Usage tracking: $([ "$TOTAL_IMAGES" -ge 2 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${YELLOW}PARTIAL${NC}")"
echo ""

if [ "$HTTP_STATUS_1" -eq 201 ] && [ "$HTTP_STATUS_2" -eq 201 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "The /v1/generate endpoint is working correctly with the real Google Gemini API!"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Check the output above for details."
    echo "Server logs available in: /tmp/nanobanana_server.log"
    exit 1
fi
