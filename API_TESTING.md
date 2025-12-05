# IoT Sensor API Testing Guide

API Base URL: `http://localhost:5000`

## 🏥 Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T16:41:15.944Z"
}
```

---

## 📱 Devices API

### Get All Devices
```bash
curl http://localhost:5000/api/devices
```

**Response:**
```json
[
  {
    "deviceId": "LIGHT_001",
    "name": "หลอดไฟห้องนั่งเล่น",
    "type": "light",
    "status": "off",
    "lastUpdate": "2025-12-04T16:41:15.944Z",
    "location": "Living Room",
    "value": 0
  },
  ...
]
```

### Get Single Device
```bash
GET /api/devices/:deviceId

curl http://localhost:5000/api/devices/LIGHT_001
```

### Toggle Device Status
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"LIGHT_001","status":"on"}'
```

**Response:**
```json
{
  "success": true,
  "device": {
    "deviceId": "LIGHT_001",
    "name": "หลอดไฟห้องนั่งเล่น",
    "type": "light",
    "status": "on",
    "lastUpdate": "2025-12-04T16:45:03.000Z",
    ...
  }
}
```

---

## 📊 Sensors API

### Get All Sensors
```bash
curl http://localhost:5000/api/sensors
```

**Response:**
```json
[
  {
    "sensorId": "TEMP_001",
    "name": "อุณหภูมิห้องนั่งเล่น",
    "type": "temperature",
    "value": 25.5,
    "unit": "°C",
    "timestamp": "2025-12-04T16:41:15.945Z",
    "location": "Living Room"
  },
  ...
]
```

### Get Single Sensor
```bash
GET /api/sensors/:sensorId

curl http://localhost:5000/api/sensors/TEMP_001
```

### Update Sensor Value
```bash
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"TEMP_001","value":28.5}'
```

---

## 🌦️ Weather API

### Get Weather Data
```bash
curl "http://localhost:5000/api/weather?city=Bangkok"
```

**Response:**
```json
{
  "city": "Bangkok",
  "temperature": 28.5,
  "humidity": 75,
  "description": "Partly Cloudy",
  "windSpeed": 8.5,
  "feelsLike": 30,
  "pressure": 1013,
  "visibility": 10,
  "uvIndex": 6,
  "timestamp": "2025-12-04T16:45:15.000Z"
}
```

---

## 🔌 AWS IoT API

### Publish Command
```bash
curl -X POST http://localhost:5000/api/iot/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "wsn/device/LIGHT_001/control",
    "command": {"action":"on","device":"LIGHT_001"}
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Command sent to device",
  "topic": "wsn/device/LIGHT_001/control",
  "command": {"action":"on","device":"LIGHT_001"},
  "timestamp": "2025-12-04T16:45:15.000Z"
}
```

---

## 🎮 Simulator API

### Start Simulator
```bash
curl -X POST http://localhost:5000/api/simulator/start \
  -H "Content-Type: application/json" \
  -d '{"interval":5000}'
```

### Stop Simulator
```bash
curl -X POST http://localhost:5000/api/simulator/stop
```

### Generate Test Data
```bash
curl -X POST http://localhost:5000/api/simulator/generate
```

**Response:**
```json
{
  "success": true,
  "message": "Sensor data generated",
  "sensors": [...]
}
```

---

## 📧 Notifications API

### Get All Notifications
```bash
curl http://localhost:5000/api/notifications
```

### Send Email Notification
```bash
curl -X POST http://localhost:5000/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Temperature Alert",
    "message": "Room temperature is too high: 35°C"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "notification": {
    "id": 1733343515000,
    "to": "user@example.com",
    "subject": "Temperature Alert",
    "message": "Room temperature is too high: 35°C",
    "status": "sent",
    "timestamp": "2025-12-04T16:45:15.000Z"
  }
}
```

---

## 🧪 Test All Endpoints (PowerShell)

```powershell
# Health Check
curl http://localhost:5000/health

# Get Devices
curl http://localhost:5000/api/devices

# Toggle Device
$body = @{deviceId="LIGHT_001"; status="on"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/devices" `
  -Method POST -ContentType "application/json" -Body $body

# Get Sensors
curl http://localhost:5000/api/sensors

# Update Sensor
$body = @{sensorId="TEMP_001"; value=28.5} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/sensors" `
  -Method POST -ContentType "application/json" -Body $body

# Get Weather
curl "http://localhost:5000/api/weather?city=Bangkok"

# Generate Simulator Data
Invoke-WebRequest -Uri "http://localhost:5000/api/simulator/generate" -Method POST
```

---

## 📝 Common Device IDs

| Device ID | Name | Type |
|-----------|------|------|
| LIGHT_001 | หลอดไฟห้องนั่งเล่น | light |
| LIGHT_002 | หลอดไฟห้องนอน | light |
| ESP32_001 | เซ็นเซอร์อุณหภูมิ | sensor |
| ESP32_002 | เซ็นเซอร์ความชื้น | sensor |

## 📝 Common Sensor IDs

| Sensor ID | Name | Type | Unit |
|-----------|------|------|------|
| TEMP_001 | อุณหภูมิห้องนั่งเล่น | temperature | °C |
| HUMIDITY_001 | ความชื้นห้องนั่งเล่น | humidity | % |
| TEMP_002 | อุณหภูมิห้องนอน | temperature | °C |

---

## ✅ Testing Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Health check responds
- [ ] Get devices returns list
- [ ] Toggle device changes status
- [ ] Get sensors returns list
- [ ] Update sensor changes value
- [ ] Weather API responds
- [ ] IoT publish works
- [ ] Notifications can be sent

---

## 🐛 Troubleshooting

**Backend won't start:**
```bash
# Kill process on port 5000
# Windows: Get-NetTCPConnection -LocalPort 5000 | Stop-Process
# macOS/Linux: lsof -i :5000 | awk '{print $2}' | xargs kill
```

**CORS errors:**
- Backend CORS is enabled by default
- Check that frontend URL is allowed in backend

**Frontend API calls fail:**
- Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Check DevTools Console for errors
- Ensure backend is running

---

Last updated: 2025-12-04
