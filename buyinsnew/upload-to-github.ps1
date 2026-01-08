# סקריפט להעלאת הפרויקט ל-GitHub
# הרץ את זה אחרי שהתקנת Git

Write-Host "🚀 מתחיל העלאה ל-GitHub..." -ForegroundColor Green

# בדוק אם Git מותקן
try {
    $gitVersion = git --version
    Write-Host "✅ Git מותקן: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git לא מותקן!" -ForegroundColor Red
    Write-Host "📥 אנא התקן Git מ: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "או השתמש ב-GitHub Desktop: https://desktop.github.com/" -ForegroundColor Yellow
    exit 1
}

# לך לתיקיית הפרויקט
$projectPath = "c:\Users\rani.OPHIRINS\Desktop\OphirBit\ophir-insurance-form"
Set-Location $projectPath

Write-Host "📁 תיקייה: $projectPath" -ForegroundColor Cyan

# אתחל Git אם צריך
if (-not (Test-Path ".git")) {
    Write-Host "🔧 מאתחל Git..." -ForegroundColor Yellow
    git init
}

# הוסף את כל הקבצים
Write-Host "📦 מוסיף קבצים..." -ForegroundColor Yellow
git add .

# בדוק אם יש שינויים
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "ℹ️  אין שינויים חדשים להעלות" -ForegroundColor Yellow
} else {
    # Commit
    Write-Host "💾 יוצר commit..." -ForegroundColor Yellow
    git commit -m "Initial commit - Insurance form"
}

# שנה את שם ה-branch ל-main
Write-Host "🌿 מעדכן branch ל-main..." -ForegroundColor Yellow
git branch -M main

# הוסף את ה-remote (אם עדיין לא)
$remoteUrl = "https://github.com/raniop/travelsure-insurance-form.git"
$existingRemote = git remote get-url origin 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "🔗 מוסיף remote..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
} elseif ($existingRemote -ne $remoteUrl) {
    Write-Host "🔄 מעדכן remote..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
} else {
    Write-Host "✅ Remote כבר מוגדר" -ForegroundColor Green
}

# Push
Write-Host "⬆️  מעלה ל-GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  אם זה מבקש username/password:" -ForegroundColor Yellow
Write-Host "   Username: raniop" -ForegroundColor Cyan
Write-Host "   Password: Personal Access Token (לא הסיסמה שלך!)" -ForegroundColor Cyan
Write-Host "   ליצור token: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ הצליח! הפרויקט עלה ל-GitHub" -ForegroundColor Green
    Write-Host "🔗 Repository: https://github.com/raniop/travelsure-insurance-form" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ שגיאה בהעלאה" -ForegroundColor Red
    Write-Host "💡 טיפים:" -ForegroundColor Yellow
    Write-Host "   1. ודא שיצרת את ה-repository ב-GitHub" -ForegroundColor White
    Write-Host "   2. אם זה מבקש authentication, צור Personal Access Token" -ForegroundColor White
    Write-Host "   3. ראה הוראות ב-QUICK_START.md" -ForegroundColor White
}
