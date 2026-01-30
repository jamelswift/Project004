/**
 * Hardware Integration Guide - AWS IoT Core + ESP32
 * 
 * ขั้นตอนการเชื่อมต่อระบบฮาร์ดแวร์จริง
 */

## 1. ตั้งค่า AWS IoT Core Thing

### สร้าง Thing ใหม่:
```bash
# AWS IoT Console
- Manage → Things → Create thing
- Thing name: ESP32_RELAY_MOISTURE
- Thing type: (ไม่ต้องเลือก)
- Autoconnect Discovery: OFF
```

### สร้าง Certificate:
```bash
# AWS IoT Console
- Things → ESP32_RELAY_MOISTURE → Certificates → Create certificate
- Download:
  - Device certificate (.pem.crt)
  - Private key (.pem.key)
  - CA certificate (Amazon Root CA 1)
```

### Attach Policy:
```bash
# AWS IoT Console
- Certificates → Select certificate → Policies → Attach policy
- ใช้ policy ที่ allow: mqtt:*, iot:* actions
```

---

## 2. โหลด Certificates ลงใน ESP32

### แปลง Certificate เป็น String:
```python
# สร้าง certs.h
import sys

with open('AmazonRootCA1.pem', 'r') as f:
    print('static const char AWS_CERT_CA[] = R"EOF(')
    print(f.read().strip())
    print(')EOF";')

# ทำซ้ำสำหรับ device certificate และ private key
```

### อัปเดต hardware/certs.h:
- แทนที่ `[YOUR_DEVICE_CERTIFICATE_HERE]` ด้วย device certificate
- แทนที่ `[YOUR_PRIVATE_KEY_HERE]` ด้วย private key

---

## 3. ตั้งค่า ESP32 Sketch

### Library ที่ต้อง:
```
- WiFi.h (built-in)
- WiFiClientSecure (built-in)
- MQTTClient (Install via Arduino IDE: Sketch → Include Library → Manage Libraries)
- ArduinoJson (Install via Arduino IDE)
```

### Upload Sketch:
```
1. เปิด hardware/esp32-aws-iot-mqtt.ino
2. แก้ไข:
   - WIFI_SSID = "YOUR_WIFI_NAME"
   - WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"
   - RELAY1_PIN = 26 (หรือ GPIO ที่ต้องการ)
   - RELAY2_PIN = 27
   - SOIL_MOISTURE_PIN = 34
3. Arduino IDE → Select Board: ESP32 Dev Module
4. Select Port: COM3 (หรือ port ที่ต่อ)
5. Upload
```

### Verify Connection:
```
- Open Serial Monitor (9600 baud)
- ดูข้อความ [AWS] ✅ Connected to AWS IoT Core
- ดูข้อความ [Heartbeat] 💓 Sent
```

---

## 4. API Endpoints ควบคุม Relay

### POST /api/relay/control (AWS IoT Shadow)
```bash
curl -X POST https://project004-backend2.onrender.com/api/relay/control \
  -H "Content-Type: application/json" \
  -d '{
    "relay1": true,
    "relay2": false
  }'

# Response:
# {
#   "success": true,
#   "message": "Commands published to device",
#   "relay1": "on",
#   "relay2": "off"
# }
```

### GET /api/relay/state
```bash
curl https://project004-backend2.onrender.com/api/relay/state

# Response:
# {
#   "relay1": "on",
#   "relay2": "off",
#   "lastUpdate": "2026-01-30T16:35:00.000Z"
# }
```

### GET /api/sensors/soil-moisture
```bash
curl https://project004-backend2.onrender.com/api/sensors/soil-moisture

# Response:
# {
#   "sensorId": "ESP32_SOIL_001",
#   "type": "soil_moisture",
#   "value": 65,
#   "unit": "%",
#   "location": "Garden",
#   "timestamp": "2026-01-30T16:35:00.000Z",
#   "lastUpdate": "2026-01-30T16:35:00.000Z"
# }
```

---

## 5. MQTT Topics ใช้งาน

### Publish (ESP32 → Backend):
- `esp32/heartbeat` - Heartbeat signal
- `esp32/soil-moisture` - Soil moisture sensor data
- `$aws/things/ESP32_RELAY_MOISTURE/shadow/update` - Shadow state update

### Subscribe (Backend → ESP32):
- `$aws/things/ESP32_RELAY_MOISTURE/shadow/update/delta` - Desired state changes
- `esp32/control/ESP32_RELAY_MOISTURE` - Direct control commands

---

## 6. Frontend Integration

### .env.production
```env
NEXT_PUBLIC_API_URL=https://project004-backend2.onrender.com
```

### React Component Example:
```tsx
// components/RelayControl.tsx
import { useState } from 'react';

export default function RelayControl() {
  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);

  const handleControlRelay = async (relay: 1 | 2, state: boolean) => {
    const payload = relay === 1 
      ? { relay1: state } 
      : { relay2: state };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/relay/control`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      }
    );

    if (res.ok) {
      relay === 1 ? setRelay1(state) : setRelay2(state);
    }
  };

  return (
    <div>
      <button onClick={() => handleControlRelay(1, !relay1)}>
        Relay 1: {relay1 ? 'ON' : 'OFF'}
      </button>
      <button onClick={() => handleControlRelay(2, !relay2)}>
        Relay 2: {relay2 ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
```

---

## 7. Troubleshooting

### ❌ ESP32 ไม่เชื่อมต่อ AWS IoT
```
- ตรวจสอบ WiFi SSID/Password
- ตรวจสอบ certificates มีถูกต้อง
- ตรวจสอบ AWS_IOT_ENDPOINT ถูกต้อง
- ตรวจสอบ Policy attached ให้ certificates
```

### ❌ Relay ไม่ตอบสนอง
```
- ตรวจสอบ GPIO pins (26, 27)
- ตรวจสอบ RELAY_ACTIVE_LOW setting
- ดู Serial Monitor ว่ามี message "[Relay]" หรือไม่
```

### ❌ Soil Moisture ไม่ส่งข้อมูล
```
- ตรวจสอบ GPIO 34 (ADC pin)
- ตรวจสอบ DRY_VALUE, WET_VALUE calibration
- ดู Serial Monitor ว่ามี message "[Soil]" หรือไม่
```

---

## 8. Test Flow

```
1. Upload sketch ไปยัง ESP32
2. ดู Serial Monitor ควรมี:
   [WiFi] Connected! IP: 192.168.x.x
   [AWS] ✅ Connected to AWS IoT Core
   [Heartbeat] 💓 Sent

3. ในเบราว์เซอร์ เปิด Dashboard
4. ไปที่ AWS IoT Section
5. Relay control UI ควรตอบสนองเมื่อกดปุ่ม

6. ดู AWS IoT Core Console:
   - Monitor → Test MQTT client
   - Subscribe: esp32/heartbeat
   - ควรเห็น messages ทุกๆ 60 วินาที
```

---

## 9. ถัดไป

- [ ] ทดสอบ relay control จาก web UI
- [ ] ทดสอบ soil moisture reading
- [ ] ตั้งค่า DynamoDB สำหรับ logging
- [ ] เพิ่ม alerts เมื่อ soil moisture ต่ำ
- [ ] เพิ่ม scheduling สำหรับ automatic watering
