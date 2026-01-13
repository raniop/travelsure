# Cleanup FTP - Remove files that are not in dist
param(
    [Parameter(Mandatory=$false)]
    [string]$FtpServer = "109.226.23.217",
    
    [Parameter(Mandatory=$false)]
    [string]$FtpPath = "/TravSure",
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

Write-Host "Starting FTP cleanup..." -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "DRY RUN MODE - No files will be deleted" -ForegroundColor Yellow
}

$sourceDir = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $sourceDir)) {
    Write-Host "Error: dist directory not found! Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

$ftpUri = "ftp://${FtpServer}${FtpPath}"

# Get list of files that should exist (from dist)
$localFiles = @{}
Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1).Replace('\', '/')
    $localFiles[$relativePath] = $true
}

Write-Host "`nLocal files (should exist on server): $($localFiles.Count)" -ForegroundColor Green

# Simple cleanup: Just show what would be cleaned
# For actual cleanup, you can manually delete old files via FTP client
# Or use this script as a reference

Write-Host "`nTo clean up old files:" -ForegroundColor Yellow
Write-Host "1. Connect to FTP: ftp://$FtpServer$FtpPath" -ForegroundColor Gray
Write-Host "2. Compare with files in 'dist' folder" -ForegroundColor Gray
Write-Host "3. Delete files that don't exist in 'dist'" -ForegroundColor Gray
Write-Host "`nFiles that should exist on server:" -ForegroundColor Green
$localFiles.Keys | Sort-Object | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host "`nNote: This is a simple reference script." -ForegroundColor Yellow
Write-Host "For automatic cleanup, you may need to use an FTP client with sync feature." -ForegroundColor Yellow
