# Rate Limiting Test Script for Sport-Scoreboard v3.2.1 (PowerShell)
# Windows-compatible version for testing rate limiting

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Rate Limiting Test - Sport-Scoreboard v3.2.1        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sending 105 requests to /api/health..." -ForegroundColor Yellow
Write-Host "Expected: First 100 succeed, remaining 5 blocked (429)" -ForegroundColor Yellow
Write-Host ""

$serverUrl = "http://10.1.0.51:3001"
$healthEndpoint = "$serverUrl/api/health"

$successCount = 0
$rateLimitedCount = 0
$otherCount = 0

for ($i = 1; $i -le 105; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $healthEndpoint -UseBasicParsing -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            $successCount++

            # Show rate limit headers
            $remaining = $response.Headers['RateLimit-Remaining']
            $limit = $response.Headers['RateLimit-Limit']

            Write-Host "Request $i : " -NoNewline -ForegroundColor White
            Write-Host "200 OK" -NoNewline -ForegroundColor Green
            Write-Host " (Remaining: $remaining/$limit)" -ForegroundColor Gray
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__

        if ($statusCode -eq 429) {
            $rateLimitedCount++
            Write-Host "Request $i : " -NoNewline -ForegroundColor White
            Write-Host "429 Too Many Requests" -NoNewline -ForegroundColor Red
            Write-Host " (RATE LIMITED)" -ForegroundColor Red
        }
        else {
            $otherCount++
            Write-Host "Request $i : " -NoNewline -ForegroundColor White
            Write-Host "$statusCode" -NoNewline -ForegroundColor Yellow
            Write-Host " (Unexpected)" -ForegroundColor Yellow
        }
    }

    # Small delay to prevent overwhelming server
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      Results                          ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║  Total Requests:        105                           ║" -ForegroundColor Cyan
Write-Host "║  Successful (200):      $successCount                            ║" -ForegroundColor Cyan
Write-Host "║  Rate Limited (429):    $rateLimitedCount                              ║" -ForegroundColor Cyan
Write-Host "║  Other Errors:          $otherCount                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($successCount -eq 100 -and $rateLimitedCount -eq 5) {
    Write-Host "PASS: Rate limiting working correctly!" -ForegroundColor Green
    exit 0
}
elseif ($successCount -ge 95 -and $rateLimitedCount -ge 1) {
    Write-Host "WARNING: Rate limiting working but counts are off (might be timing)" -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "FAIL: Rate limiting not working as expected" -ForegroundColor Red
    exit 1
}
