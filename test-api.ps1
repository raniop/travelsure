# Test API endpoint directly
$baseUrl = "https://ophir.travelsure.co.il/api-bbq.ashx"

Write-Host "Testing group_invitations endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Get all group_invitations
Write-Host "Test 1: GET all group_invitations" -ForegroundColor Yellow
$url1 = "$baseUrl?entity=group_invitations"
Write-Host "URL: $url1" -ForegroundColor Gray
try {
    $response1 = Invoke-WebRequest -Uri $url1 -Method GET -UseBasicParsing
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response1.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Get group_invitations with user_phone filter
Write-Host "Test 2: GET group_invitations with user_phone filter" -ForegroundColor Yellow
$url2 = "$baseUrl?entity=group_invitations&user_phone=0524444244"
Write-Host "URL: $url2" -ForegroundColor Gray
try {
    $response2 = Invoke-WebRequest -Uri $url2 -Method GET -UseBasicParsing
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response2.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Get group_invitations with both filters
Write-Host "Test 3: GET group_invitations with user_phone and group_id filters" -ForegroundColor Yellow
$url3 = "$baseUrl?entity=group_invitations&user_phone=0524444244&group_id=508b8137-6897-4463-bee1-961badac85eb"
Write-Host "URL: $url3" -ForegroundColor Gray
try {
    $response3 = Invoke-WebRequest -Uri $url3 -Method GET -UseBasicParsing
    Write-Host "Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response3.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Check if the file exists and get its content type
Write-Host "Test 4: Check file headers" -ForegroundColor Yellow
try {
    $headRequest = [System.Net.HttpWebRequest]::Create($url1)
    $headRequest.Method = "HEAD"
    $headResponse = $headRequest.GetResponse()
    Write-Host "Content-Type: $($headResponse.ContentType)" -ForegroundColor Green
    Write-Host "Status: $($headResponse.StatusCode)" -ForegroundColor Green
    $headResponse.Close()
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Done!" -ForegroundColor Cyan
