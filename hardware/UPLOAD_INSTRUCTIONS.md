# คำแนะนำในการอัพโหลดโค้ดไปยัง ESP32

## ขั้นตอนการอัพโหลด

### 1. เตรียม Arduino IDE
- เปิด Arduino IDE
- ไปที่ **File** → **Open** → เลือกไฟล์ `esp32-soil-moisture.ino`

### 2. ติดตั้ง Libraries (ถ้ายังไม่ได้ติดตั้ง)
ไปที่ **Tools** → **Manage Libraries** และติดตั้ง:
- ✅ **ArduinoJson** by Benoit Blanchon (v6.x)
- ✅ **ESP32** board support (ผ่าน Board Manager)

### 3. ตั้งค่า Board
- **Tools** → **Board** → **ESP32 Arduino** → **ESP32 Dev Module**
- **Tools** → **Port** → เลือก COM port ที่เชื่อมต่อกับ ESP32
- **Tools** → **Upload Speed** → **115200**

### 4. ตรวจสอบการตั้งค่าในโค้ด

```cpp
// WiFi credentials
const char* ssid = "GETZY";
const char* password = "Wipatsasicha7";

// Backend server IP (อัพเดตแล้วเป็น IP ปัจจุบัน)
const char* serverName = "http://192.168.1.172:3000/api/sensors/soil-moisture";

// GPIO pins
const int SOIL_MOISTURE_PIN = 34; // ADC pin สำหรับเซ็นเซอร์
const int LED_PIN = 2;            // LED สำหรับแสดงสถานะ
```

### 5. เชื่อมต่อฮาร์ดแวร์

```
Soil Moisture Sensor → ESP32
┌─────────────────────────────────┐
│ VCC    → 3.3V (หรือ 5V)         │
│ GND    → GND                    │
│ A0     → GPIO 34 (ADC pin)      │
└─────────────────────────────────┘

Optional LED:
│ LED +  → GPIO 2 (ใส่ตัวต้านทาน 220Ω)
│ LED -  → GND
```

### 6. Upload โค้ด
1. กด **Verify** (✓) เพื่อ Compile โค้ด
2. กด **Upload** (→) เพื่ออัพโหลดไปยัง ESP32
3. รอจนขึ้น "Done uploading"

### 7. เปิด Serial Monitor
- กด **Ctrl+Shift+M** หรือไปที่ **Tools** → **Serial Monitor**
- ตั้ง Baud rate เป็น **115200**
- จะเห็นข้อความ:
  ```
  Starting Soil Moisture Sensor...
  Connecting to WiFi: GETZY
  WiFi Connected! IP: 192.168.1.xxx
  Soil Moisture - Raw: 2500 | Percentage: 55.5%
  Sending to Backend: {...}
  HTTP Response Code: 200
  Response: {"success":true,...}
  ```

### 8. ตรวจสอบผลลัพธ์
- ✅ ESP32 ส่งข้อมูลทุก 30 วินาที
- ✅ LED กระพริบเมื่อส่งข้อมูลสำเร็จ
- ✅ Dashboard แสดงข้อมูลความชื้นในดินแบบ Real-time
- ✅ ค่าอัพเดตทุก 3 วินาทีบน Frontend

---

## สถานะปัจจุบัน

✅ **Backend**: รันอยู่ที่ `http://localhost:3000`  
✅ **API Endpoint**: `http://192.168.1.172:3000/api/sensors/soil-moisture`  
✅ **Frontend**: พร้อมแสดงผล (SoilMoistureCard)  
⏳ **ESP32**: รอการอัพโหลดโค้ด

---

## Troubleshooting

### ปัญหา: Upload failed
- ตรวจสอบ COM Port ว่าถูกต้อง
- กดปุ่ม BOOT บน ESP32 ขณะ Upload
- ลอง Upload Speed ที่ช้าลง (เช่น 921600 → 115200)

### ปัญหา: WiFi ไม่เชื่อมต่อ
- ตรวจสอบ SSID และ Password
- ตรวจสอบว่า ESP32 อยู่ในระยะ WiFi

### ปัญหา: HTTP Error 
- ตรวจสอบว่า Backend รันอยู่
- ตรวจสอบ IP Address ถูกต้อง (192.168.1.172)
- ปิง Backend จาก Command: `ping 192.168.1.172`
- ตรวจสอบ Firewall ไม่บล็อก port 3000

### ปัญหา: Dashboard ไม่แสดงข้อมูล
- เปิด Browser Console (F12) ดู Error
- ตรวจสอบ Frontend รันอยู่
- Clear browser cache และ Refresh

---

## คำสั่ง CLI สำหรับ PlatformIO (ถ้าใช้)

```bash
# Build และ Upload
pio run --target upload

# Serial Monitor
pio device monitor --baud 115200
```

---

## หมายเหตุ
- ✅ โค้ดอัพเดต IP เป็น **192.168.1.172** แล้ว
- ✅ WiFi credentials ตั้งค่าเป็น **GETZY** แล้ว
- ✅ Backend API พร้อมรับข้อมูล
- ⚠️ ควรแก้ `DRY_VALUE` และ `WET_VALUE` ตามเซ็นเซอร์จริง
