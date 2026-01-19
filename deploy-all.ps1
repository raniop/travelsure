# Deploy all files to production with credential prompt
Write-Host "Deploying all files to production..." -ForegroundColor Cyan
Write-Host ""

# Get credentials
$cred = Get-Credential -Message "Enter FTP credentials (Username and Password for server 109.226.23.217)"

if (-not $cred) {
    Write-Host "No credentials provided. Exiting." -ForegroundColor Red
    exit 1
}

$username = $cred.UserName
$password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($cred.Password))

Write-Host "Credentials received. Running full deployment..." -ForegroundColor Green
Write-Host ""

# Run the deployment script
& ".\delete-and-deploy.ps1" -Username $username -Password $password

Write-Host ""
Write-Host "Full deployment completed!" -ForegroundColor Cyan
