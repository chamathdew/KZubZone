# KSubZone Full Update Packager
# Creates backend-update.zip containing:
#   - root .htaccess (Authorization header fix + routing)
#   - server-php/ (all backend PHP files, excluding .env, sqlite db, uploads)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ($root -like "*scripts") { $root = Split-Path -Parent $root }

$zipPath  = Join-Path $root "backend-update.zip"
$tempDir  = Join-Path $root "temp-update-build"

Write-Host "=== KSubZone Update Packager ===" -ForegroundColor Cyan

# Cleanup previous
if (Test-Path $zipPath)  { Remove-Item $zipPath  -Force }
if (Test-Path $tempDir)  { Remove-Item $tempDir  -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# ── 1. Root .htaccess ──────────────────────────────────────────────────
$htaccess = Join-Path $root ".htaccess"
Copy-Item $htaccess $tempDir
Write-Host "Included: .htaccess (root)"

# ── 2. server-php folder ───────────────────────────────────────────────
$serverPhpSrc = Join-Path $root "server-php"
$serverPhpDst = Join-Path $tempDir "server-php"
Copy-Item $serverPhpSrc $serverPhpDst -Recurse
Write-Host "Copied: server-php/"

# Strip sensitive / environment-specific files
$excludes = @(
    (Join-Path $serverPhpDst "ksubzone.sqlite"),
    (Join-Path $serverPhpDst ".env"),
    (Join-Path $serverPhpDst "config\backup_config.json")
)
foreach ($f in $excludes) {
    if (Test-Path $f) {
        Remove-Item $f -Force
        Write-Host " - Excluded: $(Split-Path -Leaf $f)"
    }
}

# Clear uploads content (keep folder so structure is preserved on server)
$uploadsDir = Join-Path $serverPhpDst "uploads"
if (Test-Path $uploadsDir) {
    Get-ChildItem $uploadsDir | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host " - Cleared: uploads/ contents"
}

# ── 3. Zip ─────────────────────────────────────────────────────────────
Write-Host "Creating zip..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Cleanup temp
Remove-Item $tempDir -Recurse -Force

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "SUCCESS: backend-update.zip ($sizeMB MB) ready at:" -ForegroundColor Green
Write-Host "  $zipPath"
Write-Host ""
Write-Host "Upload this zip to your cPanel and extract it into public_html/" -ForegroundColor Yellow
Write-Host "It will update: .htaccess + all server-php/ files" -ForegroundColor Yellow
Write-Host "(Your .env and ksubzone.sqlite are SAFE - not included)" -ForegroundColor Green
