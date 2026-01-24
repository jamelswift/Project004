# Simplified data import using file method
Write-Host "[INFO] Adding sensor data to DynamoDB Sensors table..." -ForegroundColor Cyan

function Add-SensorData {
    param($sensorId, $sensorType, $value, $rawValue, $hours, $label)
    
    $ts = (Get-Date).AddHours(-$hours).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $json = "{`"sensorId`":{`"S`":`"$sensorId`"},`"timestamp`":{`"S`":`"$ts`"},`"deviceId`":{`"S`":`"esp32-relay-01`"},`"sensorType`":{`"S`":`"$sensorType`"},`"value`":{`"N`":`"$value`"},`"rawValue`":{`"N`":`"$rawValue`"},`"unit`":{`"S`":`"%`"},`"location`":{`"S`":`"Garden`"},`"status`":{`"S`":`"active`"},`"createdAt`":{`"S`":`"$ts`"}}"
    
    [System.IO.File]::WriteAllText("$PWD\temp.json", $json)
    aws dynamodb put-item --table-name Sensors --item file://temp.json --region ap-southeast-1 2>$null
   Remove-Item temp.json -ErrorAction SilentlyContinue
    
    Write-Host "[OK] $label" -ForegroundColor Green
}

# Add historical data
Add-SensorData "SOIL_MOISTURE_001" "soil_moisture" "65" "2500" 1 "Added 1h ago (65%)"
Add-SensorData "SOIL_MOISTURE_001" "soil_moisture" "70" "2200" 2 "Added 2h ago (70%)"
Add-SensorData "SOIL_MOISTURE_001" "soil_moisture" "45" "2900" 6 "Added 6h ago (45%)"
Add-SensorData "SOIL_MOISTURE_001" "soil_moisture" "30" "3300" 12 "Added 12h ago (30%)"
Add-SensorData "SOIL_MOISTURE_001" "soil_moisture" "55" "2700" 24 "Added 24h ago (55%)"
Add-SensorData "SOIL_MOISTURE_001" "soil_moisture" "85" "1800" 48 "Added 48h ago (85%)"

# Verify
Write-Host "`n[INFO] Verifying data..." -ForegroundColor Cyan
$result = aws dynamodb scan --table-name Sensors --region ap-southeast-1 --select COUNT | ConvertFrom-Json
Write-Host "[SUCCESS] Total records in Sensors table: $($result.Count)" -ForegroundColor Green
