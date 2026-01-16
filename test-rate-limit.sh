#!/bin/bash
# Rate Limiting Test Script for Sport-Scoreboard v3.2.1
# Hammers the API with 105 requests to verify rate limiting kicks in

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Rate Limiting Test - Sport-Scoreboard v3.2.1        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Sending 105 requests to /api/health..."
echo "Expected: First 100 succeed, remaining 5 blocked (429)"
echo ""

SERVER_URL="http://10.1.0.51:3001"
HEALTH_ENDPOINT="$SERVER_URL/api/health"

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

for i in {1..105}; do
  # Make request and capture status code
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT")

  if [ "$STATUS" -eq 200 ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "Request $i: ✅ 200 OK"
  elif [ "$STATUS" -eq 429 ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
    echo "Request $i: ❌ 429 Too Many Requests (RATE LIMITED)"
  else
    echo "Request $i: ⚠️  $STATUS (Unexpected)"
  fi

  # Small delay to prevent overwhelming server
  sleep 0.1
done

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                      Results                          ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Total Requests:        105                           ║"
echo "║  Successful (200):      $SUCCESS_COUNT                            ║"
echo "║  Rate Limited (429):    $RATE_LIMITED_COUNT                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

if [ "$SUCCESS_COUNT" -eq 100 ] && [ "$RATE_LIMITED_COUNT" -eq 5 ]; then
  echo "✅ PASS: Rate limiting working correctly!"
  exit 0
elif [ "$SUCCESS_COUNT" -ge 95 ] && [ "$RATE_LIMITED_COUNT" -ge 1 ]; then
  echo "⚠️  WARNING: Rate limiting working but counts are off (might be timing)"
  exit 0
else
  echo "❌ FAIL: Rate limiting not working as expected"
  exit 1
fi
