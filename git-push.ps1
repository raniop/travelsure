# Script to automatically commit and push changes to Git
# This uses Git Credential Manager - no tokens in code!

Write-Host "📝 Checking for changes..." -ForegroundColor Cyan

# Check if there are changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    exit 0
}

# Show what will be committed
Write-Host "📋 Changes found:" -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "`n📦 Staging changes..." -ForegroundColor Cyan
git add .

# Commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Auto-commit: $timestamp"

Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

# Push to origin
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed. Check your credentials." -ForegroundColor Red
    exit 1
}
