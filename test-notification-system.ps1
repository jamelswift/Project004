#!/usr/bin/env pwsh

# การทดสอบระบบแจ้งเตือน (Notification System Test)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "    Notification System Test" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:5001"
$DEVICE_ID = "ESP32_TEST_001"
$SENSOR_TYPE = "temperature"

# ฟังก์ชันเพื่อแสดงผล
function Show-Result {
    param([string]$Title, [object]$Response)
    Write-Host ""
    Write-Host "✓ $Title" -ForegroundColor Green
    Write-Host ($Response | ConvertTo-Json -Depth 3) -ForegroundColor Yellow
}

# Step 1: สร้าง Threshold
Write-Host "Step 1: สร้างค่าขีดจำกัด..." -ForegroundColor Cyan

$thresholdBody = @{
    deviceId = $DEVICE_ID
    sensorType = $SENSOR_TYPE
    minValue = 15
    maxValue = 35
    enabled = $true
} | ConvertTo-Json

$thresholdResponse = Invoke-WebRequest -Uri "$API_URL/api/thresholds" `
    -Method POST `
    -ContentType "application/json" `
    -Body $thresholdBody `
    -SkipHttpErrorCheck

Show-Result "Threshold Created" ($thresholdResponse.Content | ConvertFrom-Json)

# Step 2: สร้าง Alert Test (ค่าเกิน)
Write-Host "Step 2: สร้าง Test Alert (ค่าเกินขีดจำกัด)..." -ForegroundColor Cyan

$alertBody = @{
    deviceId = $DEVICE_ID
    sensorType = $SENSOR_TYPE
    value = 40
    message = "ทดสอบระบบแจ้งเตือน - อุณหภูมิสูงเกินไป"
    level = "critical"
} | ConvertTo-Json

$alertResponse = Invoke-WebRequest -Uri "$API_URL/api/alerts/test" `
    -Method POST `
    -ContentType "application/json" `
    -Body $alertBody `
    -SkipHttpErrorCheck

Show-Result "Test Alert Created" ($alertResponse.Content | ConvertFrom-Json)

# Step 3: ดึงการแจ้งเตือนที่ยังไม่อ่าน
Write-Host "Step 3: ดึงการแจ้งเตือนที่ยังไม่อ่าน..." -ForegroundColor Cyan

$unreadResponse = Invoke-WebRequest -Uri "$API_URL/api/alerts/unread" `
    -SkipHttpErrorCheck

Show-Result "Unread Alerts" ($unreadResponse.Content | ConvertFrom-Json)

# Step 4: ดึง Thresholds ของอุปกรณ์
Write-Host "Step 4: ดึง Thresholds ของอุปกรณ์..." -ForegroundColor Cyan

$thresholdsResponse = Invoke-WebRequest -Uri "$API_URL/api/thresholds/device/$DEVICE_ID" `
    -SkipHttpErrorCheck

Show-Result "Device Thresholds" ($thresholdsResponse.Content | ConvertFrom-Json)

# Step 5: ทดสอบ POST /api/sensors เพื่อทำให้เกิด threshold check
Write-Host "Step 5: ส่งข้อมูลเซ็นเซอร์ (อุณหภูมิ 38°C)..." -ForegroundColor Cyan

$sensorBody = @{
    sensorId = "TEMP_TEST_001"
    deviceId = $DEVICE_ID
    sensorType = $SENSOR_TYPE
    value = 38
} | ConvertTo-Json

$sensorResponse = Invoke-WebRequest -Uri "$API_URL/api/sensors" `
    -Method POST `
    -ContentType "application/json" `
    -Body $sensorBody `
    -SkipHttpErrorCheck

Show-Result "Sensor Update + Threshold Check" ($sensorResponse.Content | ConvertFrom-Json)

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ ทดสอบเสร็จสิ้น" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ขั้นตอนต่อไป:" -ForegroundColor Yellow
Write-Host "1. เปิด Frontend: http://localhost:3000"
Write-Host "2. ไปที่ Dashboard → Alerts"
Write-Host "3. ดูการแจ้งเตือนที่สร้างขึ้น"
Write-Host ""

Write-Host "API ที่สำคัญ:" -ForegroundColor Yellow
Write-Host "- GET  $API_URL/api/alerts/unread"
Write-Host "- GET  $API_URL/api/thresholds/device/{deviceId}"
Write-Host "- POST $API_URL/api/thresholds"
Write-Host "- POST $API_URL/api/sensors"
Write-Host "- POST $API_URL/api/alerts/test"
