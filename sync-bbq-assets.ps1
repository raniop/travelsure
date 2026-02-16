# After vite build: copy asset paths from dist/index.html to dist/bbq/index.html
# so /bbq/ always loads the current JS/CSS.

$distIndex = Join-Path $PSScriptRoot "dist\index.html"
$bbqIndex   = Join-Path $PSScriptRoot "dist\bbq\index.html"

if (-not (Test-Path $distIndex)) {
    Write-Host "sync-bbq-assets: dist\index.html not found, skipping." -ForegroundColor Yellow
    exit 0
}
if (-not (Test-Path $bbqIndex)) {
    Write-Host "sync-bbq-assets: dist\bbq\index.html not found, skipping." -ForegroundColor Yellow
    exit 0
}

$main = Get-Content $distIndex -Raw -Encoding UTF8
$jsMatch  = [regex]::Match($main, 'src="(/assets/index-[^"]+\.js)"')
$cssMatch = [regex]::Match($main, 'href="(/assets/index-[^"]+\.css)"')

if (-not $jsMatch.Success -or -not $cssMatch.Success) {
    Write-Host "sync-bbq-assets: could not find asset paths in dist\index.html" -ForegroundColor Red
    exit 1
}

$jsPath  = $jsMatch.Groups[1].Value
$cssPath = $cssMatch.Groups[1].Value

$bbq = Get-Content $bbqIndex -Raw -Encoding UTF8
$bbq = $bbq -replace 'src="/assets/index-[^"]+\.js"', "src=`"$jsPath`""
$bbq = $bbq -replace 'href="/assets/index-[^"]+\.css"', "href=`"$cssPath`""
Set-Content $bbqIndex $bbq -Encoding UTF8 -NoNewline

Write-Host "sync-bbq-assets: updated dist\bbq\index.html -> $jsPath, $cssPath" -ForegroundColor Green
