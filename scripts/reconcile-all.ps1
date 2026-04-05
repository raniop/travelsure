# Full Paybox vs app reconciliation (writes docs/reconcile_full_report.txt)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
python "$PSScriptRoot\reconcile_all.py" @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Open: $root\docs\reconcile_full_report.txt"
