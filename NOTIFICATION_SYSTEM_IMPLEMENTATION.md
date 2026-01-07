# ✅ ระบบแจ้งเตือน (Notification System) - สร้างแล้ว

## 📋 สรุปการเพิ่มเติม

### 1. Backend Changes (server.ts)

#### ✅ เพิ่มฟังก์ชัน Threshold Checking
- **ตำแหน่ง**: Lines 643-702
- **ฟังก์ชัน**: `checkThresholdAndCreateAlert(deviceId, sensorType, value)`
- **ผลการทำงาน**:
  - ดึง thresholds สำหรับ device
  - เปรียบเทียบค่าเซ็นเซอร์กับ min/max
  - สร้าง notification ถ้าเกิน
  - บันทึก notification ลง in-memory database

#### ✅ แก้ไข POST /api/sensors
- **ตำแหน่ง**: Lines 704-746
- **เปลี่ยนแปลง**:
  - เพิ่มรับ `deviceId` และ `sensorType` จาก request
  - เรียก `checkThresholdAndCreateAlert()` อัตโนมัติ
  - รีเทิร์น `thresholdCheck` object ในการตอบสนอง

#### ✅ เพิ่ม POST /api/alerts/test
- **ตำแหน่ง**: Lines 1158-1182
- **ผลการทำงาน**: สร้าง alert ด้วยตนเอง สำหรับทดสอบระบบ
- **ใช้สำหรับ**: ทดสอบหรือการสาธิต

### 2. Frontend Components Updates

#### ✅ อัปเดต API URLs (Port 5000 → 5001)
- **Files**:
  - `frontend/components/threshold-settings.tsx` - Line 61
  - `frontend/components/weather-widget.tsx` - Line 8
  - `frontend/components/device-control.tsx` - Line 10
  - `frontend/lib/notifications.ts` - Line 3

#### ✅ Notification Components (เดิมแล้ว)
- **NotificationCenter** (`notification-center.tsx`)
  - แสดงรายการการแจ้งเตือน
  - ทำเครื่องหมายว่าอ่านแล้ว
  - ลบการแจ้งเตือน

- **ThresholdSettings** (`threshold-settings.tsx`)
  - สร้างค่าขีดจำกัด
  - แก้ไขค่าขีดจำกัด
  - ลบค่าขีดจำกัด

#### ✅ Alerts Page (เดิมแล้ว)
- **Path**: `/app/dashboard/alerts/page.tsx`
- **Features**:
  - Tab 1: การแจ้งเตือนทั้งหมด
  - Tab 2: ค่าขีดจำกัด
  - การคำนวณสถิติ (unread count, critical count)

### 3. Documentation

#### ✅ สร้าง NOTIFICATION_SYSTEM_GUIDE.md
- วิธีใช้งานระบบ
- ตัวอย่าง API requests
- โครงสร้างข้อมูล
- คำแนะนำค่าเซ็นเซอร์

#### ✅ สร้าง test-notification-system.ps1
- PowerShell script สำหรับทดสอบระบบ
- 5 ขั้นตอนการทดสอบ
- แสดงผลลัพธ์ JSON

## 🔄 ขั้นตอนการทำงาน

```
1. สร้าง Threshold
   └─> POST /api/thresholds
       Request: { deviceId, sensorType, minValue, maxValue }

2. ส่งข้อมูลเซ็นเซอร์
   └─> POST /api/sensors
       Request: { sensorId, deviceId, sensorType, value }

3. ตรวจสอบ Threshold (อัตโนมัติ)
   └─> checkThresholdAndCreateAlert()
       - ดึง thresholds
       - เปรียบเทียบค่า
       - สร้าง notification

4. บันทึก Notification
   └─> db.notifications.push(notification)
       ID: alert-{timestamp}-{random}
       Fields: id, deviceId, sensorType, message, level, value, time, isRead

5. แสดงใน Frontend
   └─> GET /api/alerts/unread
       Frontend ดึงทุก 5-30 วินาที
       แสดงใน NotificationCenter
```

## 🧪 ทดสอบระบบ

### วิธี 1: ใช้ PowerShell Script

```powershell
cd c:\io-t-sensor-management.test
.\test-notification-system.ps1
```

### วิธี 2: ใช้ curl

```bash
# สร้าง Threshold
curl -X POST http://localhost:5001/api/thresholds \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ESP32_001","sensorType":"temperature","minValue":15,"maxValue":35,"enabled":true}'

# สร้าง Test Alert
curl -X POST http://localhost:5001/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ESP32_001","sensorType":"temperature","value":40,"message":"Test","level":"critical"}'

# ดึงการแจ้งเตือน
curl http://localhost:5001/api/alerts/unread
```

### วิธี 3: ใช้ Frontend

1. เปิด http://localhost:3000
2. ไปที่ **Dashboard → Alerts**
3. แท็บ **ค่าขีดจำกัด** → สร้างค่าใหม่
4. แท็บ **การแจ้งเตือน** → ดูรายการ

## 📊 ข้อมูลการแจ้งเตือน

### ประเภทและระดับความสำคัญ

```
Critical (🔴 แดง)
  - สำหรับค่าที่เกินค่าสูงสุดมาก
  - ต้องใช้ความสนใจทันที
  - ตัวอย่าง: อุณหภูมิ > 35°C

Warning (🟠 ส้ม)
  - สำหรับค่าที่ต่ำกว่าค่าต่ำสุดเล็กน้อย
  - ควรตรวจสอบ
  - ตัวอย่าง: อุณหภูมิ < 15°C

Info (🔵 น้ำเงิน)
  - ข้อมูลอ้างอิง
```

### ตัวอย่าง Notification Object

```json
{
  "id": "alert-1704000000000-abc123def",
  "deviceId": "ESP32_001",
  "sensorType": "temperature",
  "message": "🚨 temperature เกินขีดจำกัด: ค่า 38 เกินกว่า 35",
  "level": "critical",
  "value": 38,
  "threshold": {
    "minValue": 15,
    "maxValue": 35,
    "enabled": true
  },
  "time": "2024-01-01T12:00:00.000Z",
  "isRead": false
}
```

## 🎯 API Endpoints สำหรับระบบแจ้งเตือน

| Method | Endpoint | ผลการทำงาน |
|--------|----------|---------|
| POST | /api/thresholds | สร้าง threshold |
| GET | /api/thresholds/device/:deviceId | ดึง thresholds |
| GET | /api/thresholds/:id | ดึง threshold เดียว |
| PUT | /api/thresholds/:id | แก้ไข threshold |
| DELETE | /api/thresholds/:id | ลบ threshold |
| POST | /api/sensors | อัปเดตเซ็นเซอร์ + ตรวจสอบ threshold |
| GET | /api/alerts/device/:deviceId | ดึง alerts ของ device |
| GET | /api/alerts/unread | ดึง alerts ที่ยังไม่อ่าน |
| PUT | /api/alerts/:id/read | ทำเครื่องหมายว่าอ่านแล้ว |
| DELETE | /api/alerts/:id | ลบ alert |
| POST | /api/alerts/test | สร้าง test alert |

## ✨ Features ที่เพิ่มเติม

### ✅ Backend
- [x] Automatic threshold checking
- [x] Notification creation
- [x] Multi-level severity (critical, warning, info)
- [x] Thai language messages
- [x] Test endpoint for demo

### ✅ Frontend
- [x] NotificationCenter component
- [x] ThresholdSettings component
- [x] Alerts page with tabs
- [x] Unread count display
- [x] Critical count display
- [x] Mark as read functionality
- [x] Delete functionality
- [x] Refresh functionality

### 🔄 In Progress
- WebSocket for real-time updates
- DynamoDB persistent storage
- Email notifications
- Browser push notifications

## 🚀 ขั้นตอนต่อไป (Future Enhancements)

1. **Real-time Updates**
   - ใช้ WebSocket สำหรับ real-time notifications
   - ลบการต้องรีเฟรช manual

2. **Persistent Storage**
   - บันทึก notifications ใน DynamoDB
   - ไม่สูญหายเมื่อ restart server

3. **Email Alerts**
   - ส่งอีเมลเมื่อเกิด critical alerts
   - ใช้ AWS SES หรือ email service

4. **Browser Notifications**
   - ใช้ Web Push API
   - แจ้งเตือนแม้ browser ปิด

5. **Alert Customization**
   - ผู้ใช้เลือกช่องทางการแจ้งเตือน
   - ตั้งเวลาเงียบ (do not disturb)

6. **Analytics**
   - สถิติการแจ้งเตือน
   - แนวโน้มค่าเซ็นเซอร์
   - รายงาน

## 📁 Files ที่แก้ไข

- ✅ `backend/server.ts` - เพิ่ม threshold checking logic
- ✅ `frontend/components/threshold-settings.tsx` - อัปเดต API URL
- ✅ `frontend/components/weather-widget.tsx` - อัปเดต API URL
- ✅ `frontend/components/device-control.tsx` - อัปเดต API URL
- ✅ `frontend/lib/notifications.ts` - อัปเดต API URL

## 📝 Files ที่สร้าง

- ✅ `NOTIFICATION_SYSTEM_GUIDE.md` - คู่มือระบบแจ้งเตือน
- ✅ `test-notification-system.ps1` - สคริปต์ทดสอบ
- ✅ `NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - เอกสารนี้

## 🎉 สรุป

ระบบแจ้งเตือนแบบ threshold-based ได้ถูกสร้างเสร็จแล้ว! 🎊

**คุณสามารถ**:
- ✅ สร้างค่าขีดจำกัดสำหรับแต่ละเซ็นเซอร์
- ✅ ส่งข้อมูลเซ็นเซอร์และเกิด automatic threshold checking
- ✅ ดูการแจ้งเตือนในหน้า Alerts
- ✅ ทำเครื่องหมายว่าอ่านแล้ว
- ✅ ลบการแจ้งเตือน
- ✅ ทดสอบระบบด้วย POST /api/alerts/test

**ทดสอบตอนนี้**: `.\test-notification-system.ps1`

---

📧 สำหรับคำถามหรือปัญหา ดูเพิ่มเติมใน [NOTIFICATION_SYSTEM_GUIDE.md](./NOTIFICATION_SYSTEM_GUIDE.md)
