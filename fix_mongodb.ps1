# Elevate script to Administrator if not already running as Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       MongoDB Error 1053 Fixer           " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$serviceName = "MongoDB"
$binDir = "C:\Program Files\MongoDB\Server\8.3\bin"
$scratchDir = "C:\Users\Divya Shahapur\.gemini\antigravity\brain\1b364b5f-7fbb-4e93-b347-05619b406989\scratch"

Write-Host "`n[1/5] Stopping MongoDB service if active..." -ForegroundColor Yellow
Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "[2/5] Creating backup of original binaries (.bak)..." -ForegroundColor Yellow
if (-not (Test-Path "$binDir\mongod.exe.bak")) {
    Copy-Item "$binDir\mongod.exe" "$binDir\mongod.exe.bak" -Force
    Write-Host "  Backup created: mongod.exe.bak" -ForegroundColor Green
}
if (-not (Test-Path "$binDir\mongos.exe.bak")) {
    Copy-Item "$binDir\mongos.exe" "$binDir\mongos.exe.bak" -Force
    Write-Host "  Backup created: mongos.exe.bak" -ForegroundColor Green
}

Write-Host "[3/5] Installing patched Windows 10 compatible binaries..." -ForegroundColor Yellow
Copy-Item "$scratchDir\mongod_test.exe" "$binDir\mongod.exe" -Force
Copy-Item "$scratchDir\mongos_test.exe" "$binDir\mongos.exe" -Force
Write-Host "  Binaries successfully updated." -ForegroundColor Green

Write-Host "[4/5] Starting MongoDB service..." -ForegroundColor Yellow
Start-Service -Name $serviceName
Start-Sleep -Seconds 2

$svc = Get-Service -Name $serviceName
if ($svc.Status -eq "Running") {
    Write-Host "`nSUCCESS: MongoDB Service is now RUNNING!" -ForegroundColor Green
    Write-Host "Status: $($svc.Status)" -ForegroundColor Green
} else {
    Write-Host "`nWARNING: Service status is $($svc.Status)" -ForegroundColor Red
}

Write-Host "`n[5/5] Testing MongoDB connection with mongosh..." -ForegroundColor Yellow
try {
    & mongosh --eval "db.version()"
} catch {
    Write-Host "Could not run mongosh command." -ForegroundColor DarkYellow
}

Write-Host "`nFix complete! You can press any key to close this window." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
