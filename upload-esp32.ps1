# Upload ESP32 Firmware and Certificates to SPIFFS
# Usage: .\upload-esp32.ps1 -ComPort COM3 [-Erase]

param(
    [Parameter(Mandatory=$true)]
    [string]$ComPort,
    
    [switch]$Erase,
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$certsDir = Join-Path $rootPath "certificates"
$hwDir = Join-Path $rootPath "hardware"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ESP32 Firmware & Certificates Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Port: $ComPort" -ForegroundColor Yellow

# Check certificates
Write-Host "`nChecking certificates..." -ForegroundColor Yellow
$certs = @(
    "esp32-relay-01-certificate.pem.crt",
    "esp32-relay-01-private.pem.key",
    "AmazonRootCA1.pem"
)

$allExist = $true
foreach ($cert in $certs) {
    $path = Join-Path $certsDir $cert
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "  ✓ $cert ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $cert - NOT FOUND" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`nERROR: Some certificates are missing!" -ForegroundColor Red
    Write-Host "Run .\setup-iot-core-enhanced.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Build project
if (-not $NoBuild) {
    Write-Host "`n[1/2] Building project..." -ForegroundColor Yellow
    Push-Location $hwDir
    
    $buildOutput = platformio run -e esp32dev 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
    
    Write-Host "✓ Build successful" -ForegroundColor Green
    Pop-Location
}

# Upload firmware
Write-Host "`n[2/2] Uploading firmware to $ComPort..." -ForegroundColor Yellow
Push-Location $hwDir

$uploadOutput = platformio run -e esp32dev -t upload --upload-port $ComPort 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Upload failed" -ForegroundColor Red
    Write-Host $uploadOutput
    exit 1
}

Write-Host "✓ Firmware uploaded" -ForegroundColor Green
Pop-Location

# Note about SPIFFS
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ Firmware uploaded successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nNOTE: Certificate upload via SPIFFS requires additional setup:" -ForegroundColor Yellow
Write-Host "1. Install esptool: pip install esptool" -ForegroundColor White
Write-Host "2. Configure partition table (huge_app.csv in platformio.ini)" -ForegroundColor White
Write-Host "3. Or use Arduino IDE with SPIFFS plugin" -ForegroundColor White

Write-Host "`nQuick check - Open Serial Monitor:" -ForegroundColor Green
Write-Host "  platformio device monitor -p $ComPort" -ForegroundColor White

Write-Host "`nManual certificate upload (Linux/Mac):" -ForegroundColor Yellow
Write-Host "  esptool.py --port /dev/ttyUSB0 write_flash 0x291000 <spiffs.bin>" -ForegroundColor White
