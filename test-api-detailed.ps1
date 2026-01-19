# Test API with detailed error checking
$baseUrl = "https://ophir.travelsure.co.il/api-bbq.ashx"

Write-Host "Testing API with detailed error checking..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic request
Write-Host "Test 1: GET group_invitations" -ForegroundColor Yellow
$url1 = "${baseUrl}?entity=group_invitations"
Write-Host "URL: $url1" -ForegroundColor Gray

try {
    $response1 = Invoke-WebRequest -Uri $url1 -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response1.Headers['Content-Type'])" -ForegroundColor Cyan
    Write-Host "Response Length: $($response1.Content.Length) characters" -ForegroundColor Cyan
    if ($response1.Content.Length -lt 1000) {
        Write-Host "Full Response: $($response1.Content)" -ForegroundColor White
    } else {
        Write-Host "Response (first 500 chars): $($response1.Content.Substring(0, 500))" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            Write-Host "Response Body: $responseBody" -ForegroundColor Red
            if ($responseBody -match '"details"') {
                Write-Host "Error Details found in response" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Could not read response body: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
