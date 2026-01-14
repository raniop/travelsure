# Delete old files and deploy new ones
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

Write-Host "Starting cleanup and deployment..." -ForegroundColor Cyan

$ftpUri = "ftp://${FtpServer}${FtpPath}"

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
        # File might not exist, that's OK
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
        Write-Host "  Failed: $RemotePath - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`nDeleting old files from server..." -ForegroundColor Yellow

# Function to list and delete files from FTP directory
function Delete-FilesFromFtpDirectory {
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
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $ftpRequest.UsePassive = $true
        $response = $ftpRequest.GetResponse()
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $files = $reader.ReadToEnd().Split([Environment]::NewLine, [StringSplitOptions]::RemoveEmptyEntries)
        $reader.Close()
        $response.Close()
        
        foreach ($file in $files) {
            if ($file -match "index-.*\.(js|css)$") {
                $filePath = "${RemotePath}/${file}"
                Delete-FileFromFtp -RemotePath $filePath -FtpUri $ftpUri -Username $Username -Password $Password
                Write-Host "  Deleted: $filePath" -ForegroundColor Green
            }
        }
    } catch {
        # Directory might not exist or empty
    }
}

# Delete old index.html
Delete-FileFromFtp -RemotePath "index.html" -FtpUri $ftpUri -Username $Username -Password $Password
Write-Host "  Deleted: index.html" -ForegroundColor Green

# Delete old assets files
Delete-FilesFromFtpDirectory -RemotePath "assets" -FtpUri $ftpUri -Username $Username -Password $Password

Write-Host "`nWaiting 2 seconds before uploading..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "`nBuilding project..." -ForegroundColor Yellow
$buildResult = & npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nUploading new files..." -ForegroundColor Yellow

$sourceDir = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $sourceDir)) {
    Write-Host "Error: dist directory not found!" -ForegroundColor Red
    exit 1
}

# Upload all files from dist
$files = Get-ChildItem -Path $sourceDir -Recurse -File
$uploadedFiles = 0
$failedFiles = 0

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
    $remotePath = $relativePath.Replace('\', '/')
    
    Write-Host "  Uploading: $remotePath" -ForegroundColor Cyan
    if (Upload-FileToFtp -LocalFile $file.FullName -RemotePath $remotePath -FtpUri $ftpUri -Username $Username -Password $Password) {
        $uploadedFiles++
    } else {
        $failedFiles++
    }
}

# Also upload API files from root
$apiFiles = @("api-bbq.ashx", "api-bbq.php", "api-shatap.ashx", "api-shatap.php")
$projectRoot = $PSScriptRoot

foreach ($apiFile in $apiFiles) {
    $localApiFile = Join-Path $projectRoot $apiFile
    if (Test-Path $localApiFile) {
        Write-Host "  Uploading: $apiFile" -ForegroundColor Cyan
        if (Upload-FileToFtp -LocalFile $localApiFile -RemotePath $apiFile -FtpUri $ftpUri -Username $Username -Password $Password) {
            $uploadedFiles++
            # Also upload to root
            $rootFtpUri = "ftp://${FtpServer}"
            if (Upload-FileToFtp -LocalFile $localApiFile -RemotePath $apiFile -FtpUri $rootFtpUri -Username $Username -Password $Password) {
                $uploadedFiles++
            }
        }
    }
}

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "   Uploaded: $uploadedFiles files" -ForegroundColor Green
if ($failedFiles -gt 0) {
    Write-Host "   Failed: $failedFiles files" -ForegroundColor Red
}
