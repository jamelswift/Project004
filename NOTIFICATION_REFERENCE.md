# 📋 Notification System - Reference Card

## Quick Commands

### Start Development
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev

# Test script
.\test-notification-system.ps1
```

### Create Threshold
```bash
curl -X POST http://localhost:5001/api/thresholds \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_001",
    "sensorType": "temperature",
    "minValue": 15,
    "maxValue": 35,
    "enabled": true
  }'
```

### Send Sensor Data
```bash
curl -X POST http://localhost:5001/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "sensorId": "TEMP_001",
    "deviceId": "ESP32_001",
    "sensorType": "temperature",
    "value": 38
  }'
```

### Get Alerts
```bash
# Unread only
curl http://localhost:5001/api/alerts/unread

# Device specific
curl http://localhost:5001/api/alerts/device/ESP32_001

# With limit
curl "http://localhost:5001/api/alerts/device/ESP32_001?limit=50"
```

### Manage Alerts
```bash
# Mark as read
curl -X PUT http://localhost:5001/api/alerts/{alertId}/read

# Delete
curl -X DELETE http://localhost:5001/api/alerts/{alertId}

# Create test alert
curl -X POST http://localhost:5001/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_001",
    "sensorType": "temperature",
    "value": 40,
    "message": "Test",
    "level": "critical"
  }'
```

---

## Frontend URLs

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000/dashboard |
| Alerts | http://localhost:3000/dashboard/alerts |
| Devices | http://localhost:3000/dashboard/devices |
| Settings | http://localhost:3000/dashboard/settings |

---

## API Endpoints

### Thresholds
```
POST   /api/thresholds
GET    /api/thresholds/device/{deviceId}
GET    /api/thresholds/{id}
PUT    /api/thresholds/{id}
DELETE /api/thresholds/{id}
```

### Alerts & Notifications
```
GET    /api/alerts/device/{deviceId}
GET    /api/alerts/unread
PUT    /api/alerts/{id}/read
DELETE /api/alerts/{id}
POST   /api/alerts/test
```

### Sensors
```
POST   /api/sensors
```

---

## Sensor Types

| Type | Min | Max | Unit |
|------|-----|-----|------|
| temperature | 15 | 35 | °C |
| humidity | 30 | 80 | % |
| light | 50 | 5000 | Lux |
| pm25 | 0 | 50 | µg/m³ |
| co2 | 0 | 1000 | ppm |

---

## Alert Levels

| Level | Color | Thai | Use |
|-------|-------|------|-----|
| critical | 🔴 | วิกฤติ | value > max |
| warning | 🟠 | เตือน | value < min |
| info | 🔵 | ข้อมูล | other |

---

## Threshold Check Logic

```
If deviceId + sensorType provided:
  ├─ Get thresholds for device
  ├─ Find matching sensorType
  ├─ Check if enabled
  └─ If enabled:
      ├─ If value < minValue → WARNING
      ├─ If value > maxValue → CRITICAL
      └─ Else → No alert
Else:
  └─ Update sensor, no check
```

---

## Request/Response Examples

### POST /api/thresholds Request
```json
{
  "deviceId": "ESP32_001",
  "sensorType": "temperature",
  "minValue": 15,
  "maxValue": 35,
  "enabled": true
}
```

### POST /api/sensors Request
```json
{
  "sensorId": "TEMP_001",
  "deviceId": "ESP32_001",
  "sensorType": "temperature",
  "value": 38
}
```

### POST /api/sensors Response (with alert)
```json
{
  "success": true,
  "sensor": {...},
  "thresholdCheck": {
    "alertCreated": true,
    "notification": {
      "id": "alert-...",
      "deviceId": "ESP32_001",
      "sensorType": "temperature",
      "message": "🚨 temperature เกินขีดจำกัด: ค่า 38 เกินกว่า 35",
      "level": "critical",
      "value": 38,
      "time": "2024-...",
      "isRead": false
    }
  }
}
```

### GET /api/alerts/unread Response
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-1704000000000-abc123",
      "deviceId": "ESP32_001",
      "sensorType": "temperature",
      "message": "🚨 temperature เกินขีดจำกัด: ค่า 38 เกินกว่า 35",
      "level": "critical",
      "value": 38,
      "time": "2024-01-01T12:00:00.000Z",
      "isRead": false
    }
  ],
  "count": 1
}
```

---

## Component Usage

### Use NotificationCenter
```tsx
import NotificationCenter from "@/components/notification-center"

<NotificationCenter deviceId="ESP32_001" />
```

### Use ThresholdSettings
```tsx
import ThresholdSettings from "@/components/threshold-settings"

<ThresholdSettings deviceId="ESP32_001" />
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Cannot GET /api/alerts" | Start backend: `npm run dev` |
| Port 5001 in use | Kill process or change port |
| Alert not appearing | Click refresh, check threshold enabled |
| API 500 error | Check backend logs for error |
| CORS error | Check API_URL in .env.local |

---

## File Locations

### Backend
- Main server: `backend/server.ts`
- Threshold check: `backend/server.ts:643`
- Sensors endpoint: `backend/server.ts:704`
- Test endpoint: `backend/server.ts:1158`

### Frontend
- Alerts page: `frontend/app/dashboard/alerts/page.tsx`
- NotificationCenter: `frontend/components/notification-center.tsx`
- ThresholdSettings: `frontend/components/threshold-settings.tsx`
- Notifications lib: `frontend/lib/notifications.ts`
- API URL config: `frontend/.env.local`

### Documentation
- Guide: `NOTIFICATION_SYSTEM_GUIDE.md`
- Architecture: `NOTIFICATION_ARCHITECTURE.md`
- Summary: `NOTIFICATION_SUMMARY.md`
- Quick Start: `NOTIFICATION_QUICKSTART.md`
- Test script: `test-notification-system.ps1`

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Backend (server.ts)
```
PORT=5001
DYNAMODB_USERS_TABLE=Users
DYNAMODB_DEVICE_STATUS_TABLE=DeviceStatus
```

---

## Database Schema (In-Memory)

### Notification Object
```typescript
{
  id: string                      // "alert-{timestamp}-{random}"
  deviceId: string                // "ESP32_001"
  sensorType: string              // "temperature"
  message: string                 // Thai message
  level: 'critical' | 'warning' | 'info'
  value: number                   // Sensor value
  threshold?: {                   // Optional
    minValue?: number
    maxValue?: number
    enabled: boolean
  }
  time: string                    // ISO timestamp
  isRead: boolean                 // true/false
}
```

### Threshold Object
```typescript
{
  id: string                      // Auto-generated
  deviceId: string                // "ESP32_001"
  sensorType: string              // "temperature"
  minValue?: number               // 15
  maxValue?: number               // 35
  enabled: boolean                // true
  createdAt: string               // ISO timestamp
  updatedAt: string               // ISO timestamp
}
```

---

## Polling Behavior

- **Interval**: 30 seconds
- **Endpoint**: GET /api/alerts/unread
- **Behavior**: Frontend fetches on mount + every 30s
- **File**: `notification-center.tsx` line 41

To change interval:
```tsx
setInterval(loadNotifications, 30000)  // 30000ms = 30 seconds
```

---

## Performance Tips

1. **Limit notifications**: Use `limit` parameter
   ```bash
   curl "http://localhost:5001/api/alerts/device/ESP32_001?limit=50"
   ```

2. **Increase polling interval**: Reduce server load
   ```tsx
   setInterval(loadNotifications, 60000)  // 60 seconds
   ```

3. **Archive old alerts**: Delete old ones regularly
   ```bash
   curl -X DELETE http://localhost:5001/api/alerts/{oldAlertId}
   ```

---

## Debugging

### Enable Logs
- Backend: Check terminal for `[Alert Created]`
- Frontend: Check browser console (F12)

### Test Single Endpoint
```bash
# Just get unread alerts
curl http://localhost:5001/api/alerts/unread -v
```

### Check Request Headers
```bash
curl -v -X POST http://localhost:5001/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"TEST","value":25}'
```

### View Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. See request/response

---

## Version Info

- **System**: IoT Sensor Management
- **Feature**: Notification System v1.0
- **Backend**: Express.js + TypeScript
- **Frontend**: Next.js 16 + React
- **Language**: Thai (ไทย) + English
- **Status**: ✅ Complete & Working

---

**Last Updated**: 2024
**Quick Ref**: For full docs see NOTIFICATION_SYSTEM_GUIDE.md
