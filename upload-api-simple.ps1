# Simple upload api-bbq.ashx
param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$FtpServer = "109.226.23.217"
$projectRoot = $PSScriptRoot
$localApiFile = Join-Path $projectRoot "api-bbq.ashx"

if (-not (Test-Path $localApiFile)) {
    Write-Host "Error: api-bbq.ashx not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading api-bbq.ashx..." -ForegroundColor Cyan

$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)

# Upload to /TravSure
try {
    $webClient.UploadFile("ftp://${FtpServer}/TravSure/api-bbq.ashx", $localApiFile)
    Write-Host "  Uploaded to /TravSure/api-bbq.ashx" -ForegroundColor Green
} catch {
    Write-Host "  Failed to upload to /TravSure: $($_.Exception.Message)" -ForegroundColor Red
}

# Upload to root
try {
    $webClient.UploadFile("ftp://${FtpServer}/api-bbq.ashx", $localApiFile)
    Write-Host "  Uploaded to /api-bbq.ashx (root)" -ForegroundColor Green
} catch {
    Write-Host "  Failed to upload to root: $($_.Exception.Message)" -ForegroundColor Red
}

$webClient.Dispose()
Write-Host "`nDone!" -ForegroundColor Green
