# Script to copy files to IIS
# Run setup-iis-permissions.ps1 once as Administrator before first use

$sourcePath = Join-Path $PSScriptRoot "dist"
$destinationPath = "C:\inetpub\wwwroot\travelsure"

# Check if source directory exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "Error: dist directory not found!" -ForegroundColor Red
    Write-Host "   Run first: npm run build" -ForegroundColor Yellow
    exit 1
}

# Create destination directory if it doesn't exist
if (-not (Test-Path $destinationPath)) {
    Write-Host "Creating directory: $destinationPath" -ForegroundColor Cyan
    try {
        New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
    } catch {
        Write-Host "Error: Cannot create directory. Run setup-iis-permissions.ps1 as Administrator" -ForegroundColor Red
        exit 1
    }
}

# Copy files
Write-Host "Copying files to IIS..." -ForegroundColor Cyan
try {
    Copy-Item -Path "$sourcePath\*" -Destination $destinationPath -Recurse -Force
    Write-Host "Files copied successfully to IIS!" -ForegroundColor Green
    Write-Host "Website available at: http://localhost:90/" -ForegroundColor Cyan
} catch {
    Write-Host "Error copying files: $_" -ForegroundColor Red
    Write-Host "Tip: Run setup-iis-permissions.ps1 as Administrator once" -ForegroundColor Yellow
    exit 1
}
