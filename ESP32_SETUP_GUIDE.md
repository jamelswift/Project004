# ESP32 AWS IoT Relay Control - Setup Guide

## 📋 Overview

This setup allows ESP32 to:
1. Load SSL certificates from SPIFFS partition
2. Connect to AWS IoT Core MQTT broker
3. Subscribe to control topics and relay commands
4. Publish relay status back to AWS

## 🔧 Hardware Requirements

- **ESP32 Dev Board** (or compatible)
- **2-Channel Relay Module** with optoisolation
- **Connections:**
  - Relay CH1: GPIO 26 (labeled RN1)
  - Relay CH2: GPIO 27 (labeled RN2)
  - GND: Connect to relay GND
  - 5V: Connect to relay VCC (if needed)

## 📁 File Structure

```
certificates/
├── esp32-relay-01-certificate.pem.crt  ← Device certificate
├── esp32-relay-01-private.pem.key      ← Private key (KEEP SECRET!)
├── AmazonRootCA1.pem                   ← AWS Root CA
└── ESP32_CONFIG.txt                    ← Configuration reference

hardware/
├── platformio.ini                      ← Build config (updated)
├── src/main.cpp                        ← Main firmware code (UPDATED)
├── esp32-light-control.ino             ← Legacy (reference)
└── ...

upload-esp32.ps1                        ← PowerShell upload script
upload_certs.py                         ← Python upload script
```

## ⚙️ Setup Steps

### Step 1: Install PlatformIO
```bash
# If not installed
pip install platformio
# Or use VS Code extension
```

### Step 2: Update WiFi Credentials
Edit `hardware/src/main.cpp` (lines 23-24):
```cpp
const char* ssid = "YOUR_SSID";          // ← Change this
const char* password = "YOUR_PASSWORD";  // ← Change this
```

### Step 3: Build Project
```powershell
cd hardware
platformio run -e esp32dev
```

### Step 4: Upload Firmware via USB
```powershell
# Windows
.\upload-esp32.ps1 -ComPort COM3

# Or manually:
cd hardware
platformio run -e esp32dev -t upload --upload-port COM3
```

### Step 5: Upload Certificates to SPIFFS

**Option A: Using PlatformIO SPIFFS Plugin (Recommended)**

```bash
# Install SPIFFS plugin
platformio pkg install --platform espressif32 --tool tool-mkspiffs

# Create SPIFFS image and upload
platformio run -e esp32dev -t uploadfs --upload-port COM3
```

**Option B: Using esptool.py (Command line)**

```bash
# Install esptool
pip install esptool

# Find your SPIFFS partition offset (check platformio.ini)
# For huge_app.csv: 0x291000

# Create SPIFFS image with certificates
mkspiffs -c ./certificates -b 4096 -p 256 -s 0x6F000 spiffs.bin

# Upload to ESP32
esptool.py --port COM3 --baud 921600 write_flash 0x291000 spiffs.bin
```

**Option C: Manual Python Upload**
```bash
python upload_certs.py COM3
```

## 🚀 Verify Installation

### Check Serial Output
```bash
platformio device monitor -p COM3
```

You should see:
```
========================================
ESP32 AWS IoT Relay Control
========================================
Relay pins initialized (LOW = OFF)
SPIFFS mounted successfully
Connecting to WiFi...
WiFi connected!
IP address: 192.168.x.x
Loading certificates from SPIFFS...
  Client certificate loaded
  Private key loaded
  Root CA loaded
Connecting to AWS IoT Core... Connected!
Subscribed to: esp32-relay-01/control/channel1
Subscribed to: esp32-relay-01/control/channel2
Status published: {"thing_name":"esp32-relay-01","channel1":0,"channel2":0,"timestamp":...}
```

## 📡 AWS IoT Core Topics

### Subscribe (ESP32 listens for control commands)
- `esp32-relay-01/control/channel1` - Control relay 1
- `esp32-relay-01/control/channel2` - Control relay 2

### Publish (ESP32 sends status updates)
- `esp32-relay-01/status` - Current relay states
- `esp32-relay-01/heartbeat` - Periodic heartbeat (every 30s)

### Message Format

**Control Command (from backend → ESP32):**
```json
{
  "state": 1  // 1 = ON, 0 = OFF
}
```

**Status Message (from ESP32 → backend):**
```json
{
  "thing_name": "esp32-relay-01",
  "channel1": 0,
  "channel2": 1,
  "timestamp": 45234
}
```

## 🔒 Security Notes

⚠️ **IMPORTANT:**
1. **Private key** is stored on device - DO NOT share!
2. **Certificates** are in SPIFFS partition - password protect if possible
3. Use AWS IoT policies to restrict device permissions
4. Rotate certificates periodically

## 🐛 Troubleshooting

### Issue: "Certificate not found in SPIFFS"
**Solution:** Re-upload SPIFFS partition:
```bash
platformio run -e esp32dev -t uploadfs --upload-port COM3
```

### Issue: "Failed to connect to AWS IoT Core"
**Check:**
1. WiFi is connected (see Serial output)
2. Certificates are valid and in correct location
3. AWS IoT endpoint is correct in code (line 27)
4. Device has internet access
5. AWS IoT policy allows device access

### Issue: "Relay not responding to commands"
**Check:**
1. GPIO pins are correctly connected
2. Relay module is powered
3. MQTT messages are being received (check Serial output)
4. Publish to correct topic: `esp32-relay-01/control/channel1` or `/channel2`

### Issue: "SPIFFS upload hangs or fails"
**Solution:** Try erasing and reflashing:
```bash
esptool.py --port COM3 erase_flash
platformio run -e esp32dev -t upload --upload-port COM3
platformio run -e esp32dev -t uploadfs --upload-port COM3
```

## 📚 Backend Integration

### Control Relay via Backend

In your backend API (Node.js/Express):
```javascript
// Publish control message to IoT
const params = {
  topic: 'esp32-relay-01/control/channel1',
  qos: 1,
  payload: JSON.stringify({ state: 1 })
};

await iotDataPlane.publish(params).promise();
```

### Subscribe to Status Updates
```javascript
// Listen for status messages
const params = {
  thingName: 'esp32-relay-01',
  topic: 'esp32-relay-01/status'
};

// Subscribe using AWS IoT SDK
const subscription = await iot.subscribe(params);
```

## 📝 Environment Variables

Update `.env` in your backend:
```
AWS_IOT_ENDPOINT=a2zdea8txl0m71-ats.iot.ap-southeast-2.amazonaws.com
AWS_IOT_REGION=ap-southeast-2
AWS_IOT_THING_NAME=esp32-relay-01
```

## 🔄 Next Steps

1. ✅ Certificates generated (setup-iot-core-enhanced.ps1)
2. ⏳ Update WiFi credentials in src/main.cpp
3. ⏳ Build & upload firmware
4. ⏳ Upload certificates to SPIFFS
5. ⏳ Verify connection in Serial Monitor
6. ⏳ Test relay control from AWS IoT Console

## 📖 References

- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/latest/developerguide/)
- [PlatformIO Documentation](https://docs.platformio.org/)
- [PubSubClient Library](https://pubsubclient.knolleary.net/)
- [Arduino JSON Library](https://arduinojson.org/)

## ⚡ Quick Commands

```bash
# Build
cd hardware && platformio run -e esp32dev

# Upload firmware
platformio run -e esp32dev -t upload --upload-port COM3

# Upload SPIFFS
platformio run -e esp32dev -t uploadfs --upload-port COM3

# Monitor serial
platformio device monitor -p COM3

# Erase everything
esptool.py --port COM3 erase_flash

# List files in SPIFFS (need custom script)
```

---

**Created:** December 26, 2025  
**Updated:** See git history
