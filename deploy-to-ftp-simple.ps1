# Simple FTP deployment script
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

Write-Host "Starting FTP deployment..." -ForegroundColor Cyan

$sourceDir = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $sourceDir)) {
    Write-Host "Error: dist directory not found! Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

$ftpUri = "ftp://${FtpServer}${FtpPath}"

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

# Function to create directory
function Create-FtpDirectory {
    param(
        [string]$DirectoryPath,
        [string]$FtpUri,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $uri = "${FtpUri}/${DirectoryPath}"
        $ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $ftpRequest.UsePassive = $true
        $response = $ftpRequest.GetResponse()
        $response.Close()
        return $true
    } catch {
        # Directory might already exist
        return $false
    }
}

# Get all files from dist
Write-Host "`nUploading files..." -ForegroundColor Yellow
$files = Get-ChildItem -Path $sourceDir -Recurse -File
$totalFiles = $files.Count
$uploadedFiles = 0
$failedFiles = 0
$processedDirs = @{}

# Also upload data folder if it exists
$dataDir = Join-Path $PSScriptRoot "data"
if (Test-Path $dataDir) {
    $dataFiles = Get-ChildItem -Path $dataDir -Recurse -File
    $totalFiles += $dataFiles.Count
    foreach ($file in $dataFiles) {
        $relativePath = $file.FullName.Substring($dataDir.Length + 1)
        $remotePath = "data/" + $relativePath.Replace('\', '/')
        $remoteDir = Split-Path -Path $remotePath -Parent
        
        # Create directory if needed
        if ($remoteDir -and $remoteDir -ne '.' -and -not $processedDirs.ContainsKey($remoteDir)) {
            $processedDirs[$remoteDir] = $true
            Create-FtpDirectory -DirectoryPath $remoteDir -FtpUri $ftpUri -Username $Username -Password $Password | Out-Null
        }
        
        Write-Host "  $remotePath" -ForegroundColor Cyan
        if (Upload-FileToFtp -LocalFile $file.FullName -RemotePath $remotePath -FtpUri $ftpUri -Username $Username -Password $Password) {
            $uploadedFiles++
        } else {
            $failedFiles++
        }
    }
}

# Special handling for api-bbq.ashx - upload to both /TravSure and root
$apiFiles = @("api-bbq.ashx", "api-bbq.php", "api-shatap.ashx", "api-shatap.php")

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
    $remotePath = $relativePath.Replace('\', '/')
    $remoteDir = Split-Path -Path $remotePath -Parent
    $fileName = Split-Path -Path $remotePath -Leaf
    
    # Create directory if needed
    if ($remoteDir -and $remoteDir -ne '.' -and -not $processedDirs.ContainsKey($remoteDir)) {
        $processedDirs[$remoteDir] = $true
        Create-FtpDirectory -DirectoryPath $remoteDir -FtpUri $ftpUri -Username $Username -Password $Password | Out-Null
    }
    
    Write-Host "  $remotePath" -ForegroundColor Cyan
    if (Upload-FileToFtp -LocalFile $file.FullName -RemotePath $remotePath -FtpUri $ftpUri -Username $Username -Password $Password) {
        $uploadedFiles++
        
        # Also upload API files to root if they're in root of dist
        if ($fileName -in $apiFiles -and ($remoteDir -eq '.' -or [string]::IsNullOrEmpty($remoteDir))) {
            $rootFtpUri = "ftp://${FtpServer}"
            Write-Host "  /$fileName (root)" -ForegroundColor Cyan
            if (Upload-FileToFtp -LocalFile $file.FullName -RemotePath $fileName -FtpUri $rootFtpUri -Username $Username -Password $Password) {
                $uploadedFiles++
            }
        }
    } else {
        $failedFiles++
    }
}


Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "   Uploaded: $uploadedFiles/$totalFiles files" -ForegroundColor Green
if ($failedFiles -gt 0) {
    Write-Host "   Failed: $failedFiles files" -ForegroundColor Red
}
Write-Host "`nWebsite: http://travelsure.co.il" -ForegroundColor Cyan
Write-Host "`nNote: To clean up old files from FTP, run:" -ForegroundColor Yellow
Write-Host "   .\cleanup-ftp.ps1 -Username `"$Username`" -Password `"$Password`" -DryRun" -ForegroundColor Gray
Write-Host "   (Remove -DryRun to actually delete files)" -ForegroundColor Gray
