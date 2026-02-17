# Deploy all files to production with credential prompt (always pushes to git too)
Write-Host "Deploying all files to production..." -ForegroundColor Cyan
Write-Host ""

# Always push to git first if there are changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Uncommitted changes found. Committing and pushing to git..." -ForegroundColor Yellow
    git add -A
    git commit -m "Deploy: latest changes"
    git push
    Write-Host "Git push done." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "No uncommitted changes. Pushing to ensure remote is up to date..." -ForegroundColor Yellow
    git push
    Write-Host ""
}

# Get credentials: use saved file if exists, otherwise prompt
$username = $null
$password = $null
if (Test-Path "FTP_CREDENTIALS.ps1") {
    . .\FTP_CREDENTIALS.ps1
    $username = $FtpUsername
    $password = $FtpPassword
    Write-Host "Using saved FTP credentials." -ForegroundColor Green
}
if (-not $username -or -not $password) {
    $cred = Get-Credential -Message "Enter FTP credentials (Username and Password for server 109.226.23.217)"
    if (-not $cred) {
        Write-Host "No credentials provided. Exiting." -ForegroundColor Red
        exit 1
    }
    $username = $cred.UserName
    $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($cred.Password))
    Write-Host "Credentials received." -ForegroundColor Green
}
Write-Host ""

# Run the deployment script
& ".\delete-and-deploy.ps1" -Username $username -Password $password

Write-Host ""
Write-Host "Full deployment completed!" -ForegroundColor Cyan
