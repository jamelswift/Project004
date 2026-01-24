# Add sample sensor data to Sensors table
Write-Host "[INFO] Adding sample sensor data to Sensors table..." -ForegroundColor Cyan

# Current reading - 0%
$timestamp1 = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$item1 = "{""sensorId"":{""S"":""SOIL_MOISTURE_001""},""timestamp"":{""S"":""$timestamp1""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""soil_moisture""},""value"":{""N"":""0""},""rawValue"":{""N"":""4095""},""unit"":{""S"":""%""},""location"":{""S"":""Garden""},""status"":{""S"":""active""},""createdAt"":{""S"":""$timestamp1""}}"

aws dynamodb put-item --table-name Sensors --item $item1 --region ap-southeast-1
Write-Host "[OK] Added current reading (0%)" -ForegroundColor Green

# 1 hour ago - 65%
$timestamp2 = (Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$item2 = "{""sensorId"":{""S"":""SOIL_MOISTURE_001""},""timestamp"":{""S"":""$timestamp2""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""soil_moisture""},""value"":{""N"":""65""},""rawValue"":{""N"":""2500""},""unit"":{""S"":""%""},""location"":{""S"":""Garden""},""status"":{""S"":""active""},""createdAt"":{""S"":""$timestamp2""}}"

aws dynamodb put-item --table-name Sensors --item $item2 --region ap-southeast-1
Write-Host "[OK] Added 1h ago (65%)" -ForegroundColor Green

# 2 hours ago - 70%
$timestamp3 = (Get-Date).AddHours(-2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$item3 = "{""sensorId"":{""S"":""SOIL_MOISTURE_001""},""timestamp"":{""S"":""$timestamp3""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""soil_moisture""},""value"":{""N"":""70""},""rawValue"":{""N"":""2200""},""unit"":{""S"":""%""},""location"":{""S"":""Garden""},""status"":{""S"":""active""},""createdAt"":{""S"":""$timestamp3""}}"

aws dynamodb put-item --table-name Sensors --item $item3 --region ap-southeast-1
Write-Host "[OK] Added 2h ago (70%)" -ForegroundColor Green

# 6 hours ago - 45%
$timestamp4 = (Get-Date).AddHours(-6).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$item4 = "{""sensorId"":{""S"":""SOIL_MOISTURE_001""},""timestamp"":{""S"":""$timestamp4""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""soil_moisture""},""value"":{""N"":""45""},""rawValue"":{""N"":""2900""},""unit"":{""S"":""%""},""location"":{""S"":""Garden""},""status"":{""S"":""active""},""createdAt"":{""S"":""$timestamp4""}}"

aws dynamodb put-item --table-name Sensors --item $item4 --region ap-southeast-1
Write-Host "[OK] Added 6h ago (45%)" -ForegroundColor Green

# 12 hours ago - 30%
$timestamp5 = (Get-Date).AddHours(-12).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$item5 = "{""sensorId"":{""S"":""SOIL_MOISTURE_001""},""timestamp"":{""S"":""$timestamp5""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""soil_moisture""},""value"":{""N"":""30""},""rawValue"":{""N"":""3300""},""unit"":{""S"":""%""},""location"":{""S"":""Garden""},""status"":{""S"":""active""},""createdAt"":{""S"":""$timestamp5""}}"

aws dynamodb put-item --table-name Sensors --item $item5 --region ap-southeast-1
Write-Host "[OK] Added 12h ago (30%)" -ForegroundColor Green

# 24 hours ago - 55%
$timestamp6 = (Get-Date).AddHours(-24).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$item6 = "{""sensorId"":{""S"":""SOIL_MOISTURE_001""},""timestamp"":{""S"":""$timestamp6""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""soil_moisture""},""value"":{""N"":""55""},""rawValue"":{""N"":""2700""},""unit"":{""S"":""%""},""location"":{""S"":""Garden""},""status"":{""S"":""active""},""createdAt"":{""S"":""$timestamp6""}}"

aws dynamodb put-item --table-name Sensors --item $item6 --region ap-southeast-1
Write-Host "[OK] Added 24h ago (55%)" -ForegroundColor Green

# Relay state
$relayTimestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$itemRelay = "{""sensorId"":{""S"":""esp32-relay-01_relay_1_1""},""timestamp"":{""S"":""$relayTimestamp""},""deviceId"":{""S"":""esp32-relay-01""},""sensorType"":{""S"":""relay_control""},""value"":{""N"":""1""},""channel1"":{""N"":""1""},""channel2"":{""N"":""1""},""status"":{""S"":""active""},""createdAt"":{""S"":""$relayTimestamp""}}"

aws dynamodb put-item --table-name Sensors --item $itemRelay --region ap-southeast-1
Write-Host "[OK] Added relay state" -ForegroundColor Green

Write-Host "`n[SUCCESS] Added 7 records to Sensors table!" -ForegroundColor Green
Write-Host "[INFO] Verifying data..." -ForegroundColor Cyan
aws dynamodb scan --table-name Sensors --region ap-southeast-1 --select COUNT
