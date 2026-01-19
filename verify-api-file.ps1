# Verify api-bbq.ashx contains group_invitations
$apiFile = "api-bbq.ashx"

if (-not (Test-Path $apiFile)) {
    Write-Host "Error: api-bbq.ashx not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Checking api-bbq.ashx for group_invitations support..." -ForegroundColor Cyan
Write-Host ""

$content = Get-Content $apiFile -Raw

# Check for group_invitations in HandleGet
$handleGetCase = $content -match 'case\s+"group_invitations":'
if ($handleGetCase) {
    Write-Host "Found case group_invitations in HandleGet" -ForegroundColor Green
} else {
    Write-Host "Missing case group_invitations in HandleGet" -ForegroundColor Red
}

# Check for LoadAllJson for group_invitations
$loadAllJson = $content -match 'LoadAllJson\("group_invitations"'
if ($loadAllJson) {
    Write-Host "Found LoadAllJson for group_invitations" -ForegroundColor Green
} else {
    Write-Host "Missing LoadAllJson for group_invitations" -ForegroundColor Red
}

# Check for group_invitations in HandlePost
$handlePostCase = ($content | Select-String -Pattern 'case\s+"group_invitations":' -AllMatches).Matches.Count
if ($handlePostCase -ge 2) {
    Write-Host "Found group_invitations in HandlePost and HandlePut" -ForegroundColor Green
} else {
    Write-Host "Missing group_invitations in HandlePost/HandlePut" -ForegroundColor Red
}

# Count total occurrences
$totalOccurrences = ($content | Select-String -Pattern 'group_invitations' -AllMatches).Matches.Count
Write-Host ""
Write-Host "Total occurrences of group_invitations: $totalOccurrences" -ForegroundColor Cyan

# Check file size
$fileInfo = Get-Item $apiFile
Write-Host "File size: $($fileInfo.Length) bytes" -ForegroundColor Cyan
Write-Host "Last modified: $($fileInfo.LastWriteTime)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
