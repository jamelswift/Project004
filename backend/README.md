# IoT Sensor Management - Backend API

Mock Backend API สำหรับ IoT Sensor Management Project

## 📦 Installation

```bash
cd backend
npm install
```

## 🚀 Running

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server จะ run ที่ `http://localhost:5000`

## 📡 API Endpoints

### Devices
- `GET /api/devices` - ดึงข้อมูลอุปกรณ์ทั้งหมด
- `GET /api/devices/:deviceId` - ดึงข้อมูลอุปกรณ์เฉพาะ
- `POST /api/devices` - อัปเดตสถานะอุปกรณ์ 
  ```json
  { "deviceId": "LIGHT_001", "status": "on" }
  ```

### Sensors
- `GET /api/sensors` - ดึงข้อมูล sensor ทั้งหมด
- `GET /api/sensors/:sensorId` - ดึงข้อมูล sensor เฉพาะ
- `POST /api/sensors` - อัปเดตค่า sensor
  ```json
  { "sensorId": "TEMP_001", "value": 25.5 }
  ```

### IoT Publish
- `POST /api/iot/publish` - ส่งคำสั่งไปยัง AWS IoT
  ```json
  { "topic": "wsn/device/LIGHT_001/control", "command": { "action": "on" } }
  ```

### Weather
- `GET /api/weather?city=Bangkok` - ดึงข้อมูลสภาพอากาศ (Mock)

### Simulator
- `POST /api/simulator/start` - เริ่มการจำลองข้อมูล
- `POST /api/simulator/stop` - หยุดการจำลองข้อมูล
- `POST /api/simulator/generate` - สร้างข้อมูลจำลองทันที

### Notifications
- `GET /api/notifications` - ดึงข้อมูล notification ทั้งหมด
- `POST /api/notifications/email` - ส่ง email notification
  ```json
  { "to": "user@example.com", "subject": "Alert", "message": "Hello" }
  ```

## 🔌 CORS

Backend ได้เปิด CORS สำหรับ Frontend ในพื้นที่เดียวกันหรือที่มี `NEXT_PUBLIC_API_URL` กำหนด

## 🔧 Configuration

ดูไฟล์ `.env.example` สำหรับตัวแปรสิ่งแวดล้อมที่มี

- `PORT` - พอร์ตของ Backend (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `WEATHER_API_KEY` - API Key สำหรับ OpenWeatherMap

## 📝 Notes

- ข้อมูลทั้งหมดเก็บใน memory ดังนั้นจะหายเมื่อ restart server
- สำหรับ production ให้เชื่อมต่อ Database จริง (MongoDB, PostgreSQL, etc.)
- Backend ใช้ Express.js ซึ่งเป็น lightweight และสามารถ scale ได้ง่าย
