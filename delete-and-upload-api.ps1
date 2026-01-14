# Delete and re-upload api-bbq.ashx
param(
    [Parameter(Mandatory=$false)]
    [string]$FtpServer = "109.226.23.217",
    
    [Parameter(Mandatory=$false)]
    [string]$FtpPath = "/TravSure",
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "Deleting and re-uploading api-bbq.ashx..." -ForegroundColor Cyan

$projectRoot = $PSScriptRoot
$localApiFile = Join-Path $projectRoot "api-bbq.ashx"

if (-not (Test-Path $localApiFile)) {
    Write-Host "Error: api-bbq.ashx not found in project root!" -ForegroundColor Red
    exit 1
}

# Function to delete file from FTP
function Delete-FileFromFtp {
    param(
        [string]$RemotePath,
        [string]$FtpUri,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $uri = "${FtpUri}/${RemotePath}"
        $ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
        $ftpRequest.UsePassive = $true
        $response = $ftpRequest.GetResponse()
        $response.Close()
        return $true
    } catch {
        Write-Host "  Delete failed (file might not exist): $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Function to upload file using WebClient
function Upload-FileToFtp {
    param(
        [string]$LocalFile,
        [string]$RemotePath,
        [string]$FtpUri,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $uri = "${FtpUri}/${RemotePath}"
        $webClient = New-Object System.Net.WebClient
        $webClient.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
        $webClient.UploadFile($uri, $LocalFile)
        $webClient.Dispose()
        return $true
    } catch {
        Write-Host "  Upload failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Delete from /TravSure
$ftpUri = "ftp://${FtpServer}${FtpPath}"
Write-Host "`nDeleting from /TravSure/api-bbq.ashx..." -ForegroundColor Yellow
Delete-FileFromFtp -RemotePath "api-bbq.ashx" -FtpUri $ftpUri -Username $Username -Password $Password

# Delete from root
$rootFtpUri = "ftp://${FtpServer}"
Write-Host "Deleting from /api-bbq.ashx (root)..." -ForegroundColor Yellow
Delete-FileFromFtp -RemotePath "api-bbq.ashx" -FtpUri $rootFtpUri -Username $Username -Password $Password

# Wait a moment
Start-Sleep -Seconds 2

# Upload to /TravSure
Write-Host "`nUploading to /TravSure/api-bbq.ashx..." -ForegroundColor Yellow
if (Upload-FileToFtp -LocalFile $localApiFile -RemotePath "api-bbq.ashx" -FtpUri $ftpUri -Username $Username -Password $Password) {
    Write-Host "  ✓ Uploaded to /TravSure" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload to /TravSure" -ForegroundColor Red
    exit 1
}

# Upload to root
Write-Host "Uploading to root /api-bbq.ashx..." -ForegroundColor Yellow
if (Upload-FileToFtp -LocalFile $localApiFile -RemotePath "api-bbq.ashx" -FtpUri $rootFtpUri -Username $Username -Password $Password) {
    Write-Host "  ✓ Uploaded to root" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to upload to root" -ForegroundColor Red
    exit 1
}

Write-Host "`nDone! api-bbq.ashx has been deleted and re-uploaded." -ForegroundColor Green
Write-Host "`nPlease verify the file on the server contains case users in 3 places." -ForegroundColor Cyan
