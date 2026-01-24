# Setup Sensors Table in DynamoDB
# This script creates the Sensors table and adds sample data

Write-Host "🔧 Setting up Sensors table in DynamoDB..." -ForegroundColor Cyan

# Create Sensors table
Write-Host "`n📊 Creating Sensors table..." -ForegroundColor Yellow
try {
    aws dynamodb create-table `
        --table-name Sensors `
        --attribute-definitions `
            AttributeName=sensorId,AttributeType=S `
            AttributeName=timestamp,AttributeType=S `
        --key-schema `
            AttributeName=sensorId,KeyType=HASH `
            AttributeName=timestamp,KeyType=RANGE `
        --billing-mode PAY_PER_REQUEST `
        --region ap-southeast-1 2>$null

    Write-Host "✅ Sensors table created successfully!" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "⚠️  Table might already exist or error occurred" -ForegroundColor Yellow
}

# Wait for table to be active
Write-Host "`n⏳ Waiting for table to be active..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Add sample sensor data
Write-Host "`n📝 Adding sample sensor data..." -ForegroundColor Yellow

# Soil moisture sensor current reading
$timestamp1 = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
aws dynamodb put-item `
    --table-name Sensors `
    --item '{
        "sensorId": {"S": "SOIL_MOISTURE_001"},
        "timestamp": {"S": "'"$timestamp1"'"},
        "deviceId": {"S": "esp32-relay-01"},
        "sensorType": {"S": "soil_moisture"},
        "value": {"N": "0"},
        "rawValue": {"N": "4095"},
        "unit": {"S": "%"},
        "location": {"S": "Garden"},
        "status": {"S": "active"},
        "createdAt": {"S": "'"$timestamp1"'"}
    }' `
    --region ap-southeast-1

Write-Host "✅ Added SOIL_MOISTURE_001 current reading" -ForegroundColor Green

# Add historical soil moisture data (last 24 hours)
Write-Host "`n📊 Adding historical data..." -ForegroundColor Cyan

# 1 hour ago - 65%
$timestamp2 = (Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
aws dynamodb put-item `
    --table-name Sensors `
    --item '{
        "sensorId": {"S": "SOIL_MOISTURE_001"},
        "timestamp": {"S": "'"$timestamp2"'"},
        "deviceId": {"S": "esp32-relay-01"},
        "sensorType": {"S": "soil_moisture"},
        "value": {"N": "65"},
        "rawValue": {"N": "2500"},
        "unit": {"S": "%"},
        "location": {"S": "Garden"},
        "status": {"S": "active"},
        "createdAt": {"S": "'"$timestamp2"'"}
    }' `
    --region ap-southeast-1

# 2 hours ago - 70%
$timestamp3 = (Get-Date).AddHours(-2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
aws dynamodb put-item `
    --table-name Sensors `
    --item '{
        "sensorId": {"S": "SOIL_MOISTURE_001"},
        "timestamp": {"S": "'"$timestamp3"'"},
        "deviceId": {"S": "esp32-relay-01"},
        "sensorType": {"S": "soil_moisture"},
        "value": {"N": "70"},
        "rawValue": {"N": "2200"},
        "unit": {"S": "%"},
        "location": {"S": "Garden"},
        "status": {"S": "active"},
        "createdAt": {"S": "'"$timestamp3"'"}
    }' `
    --region ap-southeast-1

# 6 hours ago - 45%
$timestamp4 = (Get-Date).AddHours(-6).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
aws dynamodb put-item `
    --table-name Sensors `
    --item '{
        "sensorId": {"S": "SOIL_MOISTURE_001"},
        "timestamp": {"S": "'"$timestamp4"'"},
        "deviceId": {"S": "esp32-relay-01"},
        "sensorType": {"S": "soil_moisture"},
        "value": {"N": "45"},
        "rawValue": {"N": "2900"},
        "unit": {"S": "%"},
        "location": {"S": "Garden"},
        "status": {"S": "active"},
        "createdAt": {"S": "'"$timestamp4"'"}
    }' `
    --region ap-southeast-1

# 12 hours ago - 30%
$timestamp5 = (Get-Date).AddHours(-12).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
aws dynamodb put-item `
    --table-name Sensors `
    --item '{
        "sensorId": {"S": "SOIL_MOISTURE_001"},
        "timestamp": {"S": "'"$timestamp5"'"},
        "deviceId": {"S": "esp32-relay-01"},
        "sensorType": {"S": "soil_moisture"},
        "value": {"N": "30"},
        "rawValue": {"N": "3300"},
        "unit": {"S": "%"},
        "location": {"S": "Garden"},
        "status": {"S": "active"},
        "createdAt": {"S": "'"$timestamp5"'"}
    }' `
    --region ap-southeast-1

Write-Host "✅ Historical data added (5 records)" -ForegroundColor Green

# Add relay state records
Write-Host "`n🔌 Adding relay state data..." -ForegroundColor Cyan

$relayTimestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
aws dynamodb put-item `
    --table-name Sensors `
    --item '{
        "sensorId": {"S": "esp32-relay-01_relay_1_1"},
        "timestamp": {"S": "'"$relayTimestamp"'"},
        "deviceId": {"S": "esp32-relay-01"},
        "sensorType": {"S": "relay_control"},
        "value": {"N": "1"},
        "channel1": {"N": "1"},
        "channel2": {"N": "1"},
        "status": {"S": "active"},
        "createdAt": {"S": "'"$relayTimestamp"'"}
    }' `
    --region ap-southeast-1

Write-Host "✅ Relay state data added" -ForegroundColor Green

# Verify data
Write-Host "`n🔍 Verifying table contents..." -ForegroundColor Cyan
aws dynamodb scan --table-name Sensors --region ap-southeast-1 --output table

Write-Host "[OK] Sensors table setup complete!" -ForegroundColor Green
Write-Host "[INFO] Total records added: 6 (5 soil moisture + 1 relay state)" -ForegroundColor Cyan
Write-Host "[TIP] Backend will now save data to this table automatically" -ForegroundColor Yellow
