#!/bin/bash
# CORS Testing Script for Sport-Scoreboard v3.2.1
# Tests CORS configuration to ensure only allowed origins can access the API

echo "╔════════════════════════════════════════════════════════╗"
echo "║   CORS Configuration Test - Sport-Scoreboard v3.2.1  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

SERVER_URL="http://10.1.0.51:3001"
HEALTH_ENDPOINT="$SERVER_URL/api/health"

# Test 1: Allowed origin (localhost:5173)
echo "Test 1: Allowed Origin (localhost:5173)"
echo "========================================="
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -i -X OPTIONS "$HEALTH_ENDPOINT" 2>&1 | grep -E "HTTP|Access-Control"

echo ""
echo "✅ Expected: HTTP 200 OK with Access-Control-Allow-Origin header"
echo ""

# Test 2: Allowed origin (production server)
echo "Test 2: Allowed Origin (10.1.0.51:3001)"
echo "=========================================="
curl -H "Origin: http://10.1.0.51:3001" \
     -H "Access-Control-Request-Method: GET" \
     -i -X OPTIONS "$HEALTH_ENDPOINT" 2>&1 | grep -E "HTTP|Access-Control"

echo ""
echo "✅ Expected: HTTP 200 OK with Access-Control-Allow-Origin header"
echo ""

# Test 3: Blocked origin (evil.com)
echo "Test 3: Blocked Origin (evil.com)"
echo "==================================="
curl -H "Origin: http://evil.com" \
     -H "Access-Control-Request-Method: GET" \
     -i -X OPTIONS "$HEALTH_ENDPOINT" 2>&1 | grep -E "HTTP|Access-Control|Error"

echo ""
echo "❌ Expected: HTTP 500 or no Access-Control headers (blocked)"
echo ""

# Test 4: No origin (same-origin request)
echo "Test 4: No Origin (Same-Origin)"
echo "================================"
curl -i -X OPTIONS "$HEALTH_ENDPOINT" 2>&1 | grep -E "HTTP|Access-Control"

echo ""
echo "✅ Expected: HTTP 200 OK (same-origin allowed)"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║                  CORS Tests Complete                  ║"
echo "╚════════════════════════════════════════════════════════╝"
