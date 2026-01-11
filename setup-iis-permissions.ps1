# Script to set up IIS permissions (Run once as Administrator)
# Run PowerShell as Administrator and run: .\setup-iis-permissions.ps1

Write-Host "Setting up IIS permissions..." -ForegroundColor Cyan

$iisPath = "C:\inetpub\wwwroot\travelsure"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Create directory if it doesn't exist
if (-not (Test-Path $iisPath)) {
    Write-Host "Creating directory: $iisPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $iisPath -Force | Out-Null
}

# Grant write permissions to current user
Write-Host "Granting write permissions to: $currentUser" -ForegroundColor Yellow

$acl = Get-Acl $iisPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $currentUser,
    "Modify",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
)
$acl.SetAccessRule($accessRule)
Set-Acl -Path $iisPath -AclObject $acl

Write-Host "Permissions set successfully!" -ForegroundColor Green
Write-Host "You can now run 'npm run build:deploy' without Administrator" -ForegroundColor Cyan
