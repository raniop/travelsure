# Deploy api-bbq.ashx with credential prompt
Write-Host "Deploying api-bbq.ashx to server..." -ForegroundColor Cyan
Write-Host ""

# Get credentials
$cred = Get-Credential -Message "Enter FTP credentials (Username and Password for server 109.226.23.217)"

if (-not $cred) {
    Write-Host "No credentials provided. Exiting." -ForegroundColor Red
    exit 1
}

$username = $cred.UserName
$password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($cred.Password))

Write-Host "Credentials received. Running deployment..." -ForegroundColor Green
Write-Host ""

# Run the deployment script
& ".\delete-and-upload-api.ps1" -Username $username -Password $password

Write-Host ""
Write-Host "Deployment completed!" -ForegroundColor Cyan
