# PlatformIO Upload Instructions - Soil Moisture Sensor

## ขั้นตอนอัพโหลดผ่าน PlatformIO

### 1. ติดตั้ง PlatformIO (ถ้ายังไม่ได้ติดตั้ง)

#### วิธีที่ 1: ผ่าน VS Code Extension
- เปิด VS Code
- ไปที่ Extensions (Ctrl+Shift+X)
- ค้นหา "PlatformIO IDE"
- คลิก Install

#### วิธีที่ 2: ผ่าน Command Line
```bash
pip install platformio
```

### 2. เปิดโปรเจค
```bash
cd c:\io-t-sensor-management.test\hardware
```

### 3. ตรวจสอบอุปกรณ์ที่เชื่อมต่อ
```bash
pio device list
```
ผลลัพธ์จะแสดง COM port เช่น:
```
COM3
----
Hardware ID: USB VID:PID=1A86:7523
Description: USB-SERIAL CH340 (COM3)
```

### 4. แก้ไข platformio.ini (ถ้าต้องการระบุ COM port)
เปิดไฟล์ `platformio.ini` และแก้:
```ini
[env:soil_moisture]
upload_port = COM3      ; <-- แก้เป็น COM port ของคุณ
monitor_port = COM3     ; <-- แก้เป็น COM port ของคุณ
```

### 5. Build โปรเจค
```bash
pio run -e soil_moisture
```

### 6. Upload ไปยัง ESP32
```bash
pio run -e soil_moisture --target upload
```

### 7. เปิด Serial Monitor
```bash
pio device monitor -b 115200
```

หรือรันทั้งหมดพร้อมกัน:
```bash
pio run -e soil_moisture --target upload && pio device monitor -b 115200
```

### 8. ตรวจสอบผลลัพธ์
คุณจะเห็นข้อความใน Serial Monitor:
```
Starting Soil Moisture Sensor...
Connecting to WiFi: GETZY
.......
WiFi Connected!
IP Address: 192.168.1.xxx
Soil Moisture - Raw: 2500 | Percentage: 55.5%
Sending to Backend: {"sensorId":"SOIL_MOISTURE_001",...}
HTTP Response Code: 200
Response: {"success":true,...}
```

---

## คำสั่ง PlatformIO ที่มีประโยชน์

### Build
```bash
pio run -e soil_moisture
```

### Upload
```bash
pio run -e soil_moisture -t upload
```

### Clean
```bash
pio run -e soil_moisture -t clean
```

### Serial Monitor
```bash
pio device monitor
```

### Upload + Monitor (แนะนำ)
```bash
pio run -e soil_moisture -t upload && pio device monitor
```

### List devices
```bash
pio device list
```

### Update libraries
```bash
pio pkg update
```

---

## Environment ที่มีอยู่

### `soil_moisture` (Default)
- โปรเจคแบบ Standalone สำหรับ Soil Moisture Sensor
- ใช้ HTTP POST ส่งข้อมูลไปยัง Backend
- ไฟล์: `src/soil-moisture-standalone.cpp`

### `esp32dev`
- โปรเจคหลัก (AWS IoT + MQTT)
- รวม Relay Control + Soil Moisture
- ไฟล์: `src/main.cpp`

สลับ Environment:
```bash
pio run -e esp32dev -t upload    # สำหรับโปรเจคหลัก
pio run -e soil_moisture -t upload  # สำหรับ Soil Moisture แบบ Standalone
```

---

## VS Code Integration

### Upload ผ่าน GUI
1. เปิดโปรเจค `hardware/` ใน VS Code
2. คลิกไอคอน PlatformIO ที่ Sidebar
3. เลือก "soil_moisture" → "Upload"
4. รอจนเสร็จ
5. คลิก "Monitor" เพื่อดู Serial output

### Keyboard Shortcuts (เมื่อติดตั้ง PlatformIO)
- **Ctrl+Alt+U**: Upload
- **Ctrl+Alt+B**: Build
- **Ctrl+Alt+S**: Serial Monitor

---

## Configuration ปัจจุบัน

### WiFi
```cpp
const char* ssid = "GETZY";
const char* password = "Wipatsasicha7";
```

### Backend URL
```cpp
const char* serverName = "http://192.168.1.172:3000/api/sensors/soil-moisture";
```

### Hardware
```cpp
const int SOIL_MOISTURE_PIN = 34;  // ADC pin
const int LED_PIN = 2;             // Status LED
```

---

## Troubleshooting

### Error: Cannot open port
```bash
# ปิด Serial Monitor ก่อน Upload
# หรือระบุ port อื่น
```

### Error: Library not found
```bash
pio pkg install
```

### Error: Espressif platform not installed
```bash
pio pkg install -p espressif32
```

### Upload ช้า
```ini
; ลด upload_speed ใน platformio.ini
upload_speed = 115200  ; ลดจาก 921600
```

### Serial Monitor ไม่แสดงผล
```bash
# ตรวจสอบ baud rate
pio device monitor -b 115200
```

---

## สถานะปัจจุบัน

✅ **PlatformIO Config**: พร้อมใช้งาน  
✅ **Source Code**: `src/soil-moisture-standalone.cpp`  
✅ **Backend**: http://192.168.1.172:3000  
✅ **WiFi**: GETZY  
✅ **Default Environment**: `soil_moisture`  

---

## Quick Start

```bash
# เข้าโฟลเดอร์ hardware
cd c:\io-t-sensor-management.test\hardware

# เสียบ ESP32 เข้า USB

# Upload และเปิด Monitor ในคำสั่งเดียว
pio run -e soil_moisture -t upload && pio device monitor -b 115200
```

เสร็จแล้ว! 🚀
