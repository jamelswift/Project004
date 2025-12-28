# ESP32 AWS IoT SSL Error -80 (0050) - Troubleshooting Guide

## Problem
```
[start_ssl_client():273]: (-80) UNKNOWN ERROR CODE (0050)
[WiFiClientSecure.cpp:144] connect(): start_ssl_client: -80
```

This error occurs when the ESP32 cannot establish a TLS handshake with AWS IoT Core.

---

## Root Causes (in order of likelihood)

### 1. **System Time is WRONG** ⚠️ (Most Common)
- **Symptom**: Diagnostics show "Time is INVALID (before 2020)"
- **Why**: SSL certificates have validity periods. If device time is wrong, certificate validation fails even with `setInsecure()`
- **Fix**:
  ```cpp
  // The code now automatically detects and retries time sync
  // Watch for this in serial output:
  // "✓ Time synced: Wed Dec 28 10:35:45 2025"
  ```
- **Manual Check**:
  - Open Serial Monitor (115200 baud)
  - Look for the line: `Current GMT Time: ...`
  - Verify it shows current date/time, not something like `Jan 1 1970`

### 2. **NTP Time Sync Failed**
- **Symptom**: The `sync_time()` function times out
- **Cause**: No internet connection, NTP servers unreachable, or WiFi connects too late
- **Fix**:
  ```cpp
  // Ensure WiFi is connected BEFORE calling sync_time()
  // The code now includes better retry logic:
  // - Waits 60 attempts (30 seconds) instead of 30
  // - Retries sync_time() automatically if it fails
  ```
- **Check**:
  - Is WiFi connected? (look for "IP address: 192.168.x.x")
  - Can you ping pool.ntp.org from your router?

### 3. **Certificate Chain Incomplete**
- **Symptom**: Diagnostics show certificates are loaded, but SSL still fails
- **Cause**: The device certificate file is missing intermediate certificates
- **Fix**:
  ```bash
  # Verify certificate chain completeness:
  # 1. Device cert should be about 1200-1400 bytes
  # 2. Private key should be about 1600-1700 bytes  
  # 3. Root CA should be about 1200 bytes
  
  # If sizes don't match, regenerate certificates from AWS IoT Core
  ```

### 4. **Certificate/Key Format Issues**
- **Symptom**: Certificates load but TLS still fails
- **Cause**: File might have extra whitespace, wrong line endings, or BOM
- **Fix**:
  ```cpp
  // Code now verifies certificates are loaded:
  // "✓ Certificate loaded: 1240 bytes"
  // If you see 0 bytes, file didn't load properly
  ```
- **Check Files in SPIFFS**:
  - Open Arduino IDE → Tools → ESP32 Sketch Data Upload
  - Ensure files exist: `/device.pem.crt`, `/private.pem.key`, `/AmazonRootCA1.pem`

### 5. **WiFiClientSecure Buffer Issues**
- **Symptom**: "NOTE: setBufferSizes not available"
- **Cause**: Your ESP32 core is very old
- **Fix**: Update your ESP32 board definition
  ```
  Tools → Board Manager → search "esp32" → Update to latest version
  ```

---

## Diagnostic Steps

### Step 1: Run the Diagnostic Function
The code now automatically runs `diagnose_tls_issue()` at startup. Look for:
```
========== TLS DIAGNOSTICS ==========
✓ System time is valid
✓ WiFi connected: 192.168.1.100
✓ Certificate loaded: 1240 bytes
✓ Private key loaded: 1675 bytes
✓ CA certificate loaded: 1206 bytes
=====================================
```

### Step 2: Check Serial Output Sequence
You should see this exact flow:
```
1. "SPIFFS mounted successfully" ✓
2. "Connecting to WiFi..." 
3. "WiFi connected!" + IP address ✓
4. "Waiting for NTP time sync.........." 
5. "✓ Time synced: Wed Dec 28 10:35:45 2025" ✓
6. "Loading certificates from SPIFFS..."
7. "Cert size: 1240, Key size: 1675, CA size: 1206" ✓
8. "✓ TLS credentials loaded into WiFiClientSecure"
9. "MQTT client configured"
10. "Connecting to AWS IoT Core... ✓ Connected!" ✓
```

If you see a failure at step X, that's where the problem is.

### Step 3: Isolated Diagnostic
If time sync is failing, you can also manually run diagnostics with:
```cpp
// Add this to your loop for testing:
if (/* some condition */) {
  diagnose_tls_issue();
}
```

---

## Quick Fixes (in order of what to try)

### Fix #1: Force WiFi Connection
```cpp
// Make sure WiFi connects BEFORE time sync
// In setup(), verify you see "WiFi connected!" before "Waiting for NTP"
```

### Fix #2: Wait Longer for Time Sync
- The new code waits up to 30 seconds instead of 15
- If it still fails, your WiFi/internet is the problem
- Test: `ping pool.ntp.org` from your computer

### Fix #3: Use Different NTP Servers
```cpp
// In sync_time(), try swapping server order:
configTime(7 * 3600, 0, "time.google.com", "time.nist.gov", "pool.ntp.org");
```

### Fix #4: Manually Set Time (Emergency Only)
```cpp
// If NTP keeps failing, hardcode the time temporarily for testing:
struct timeval tv;
tv.tv_sec = 1735353345;  // Dec 28, 2025 10:35:45 UTC
settimeofday(&tv, nullptr);
```

### Fix #5: Regenerate Certificates
If all else fails, the certificates might be corrupted:
```bash
# On your backend server:
aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile cert.pem \
  --public-key-outfile public.key \
  --private-key-outfile private.key
```

---

## AWS IoT Core Certificate Verification

### Verify certificates are valid from AWS
```bash
# Check when your device cert expires:
openssl x509 -in device.pem.crt -noout -dates

# Output should show:
# notBefore=Dec 28 00:00:00 2023 GMT
# notAfter=Dec 27 23:59:59 2033 GMT
```

### Verify Root CA matches AWS
```bash
# Amazon's Root CA1 should match:
# Subject: CN=Amazon Root CA 1
openssl x509 -in AmazonRootCA1.pem -noout -text | grep "Subject:"
```

---

## Final Checklist

- [ ] Serial output shows "✓ Time synced" (not a warning)
- [ ] WiFi is showing "WiFi connected!" with valid IP
- [ ] Diagnostic shows all certificates loaded with correct sizes
- [ ] AWS IoT endpoint is correct: `a2zdea8txl0m71-ats.iot.ap-southeast-1.amazonaws.com`
- [ ] Certificate files exist in SPIFFS (/device.pem.crt, /private.pem.key, /AmazonRootCA1.pem)
- [ ] Thing name in code matches AWS IoT Core Thing: `esp32-relay-01`
- [ ] MQTT broker port is 8883 (secure)

---

## Still Not Working?

If you still see error -80 after all these checks:

1. **Save your serial output** and check if it shows:
   - Correct system time ✓
   - All certificates loaded ✓
   - WiFi connected ✓

2. **Try the simple test**: Replace your certificates with exact copies from AWS (not pre-existing ones)

3. **Check AWS IoT Policy**:
   ```bash
   aws iot get-thing --thing-name esp32-relay-01
   aws iot list-principal-things --principal <CERT_ARN>
   ```

4. **Enable more verbose logging** (if using Arduino with external debug):
   ```cpp
   // Add before setup():
   log_e("Enable detailed ESP32 logging");
   ```

---

## Additional Resources

- [ESP32 WiFiClientSecure Documentation](https://github.com/espressif/arduino-esp32/tree/master/libraries/WiFiClientSecure)
- [AWS IoT Core Device Certificates](https://docs.aws.amazon.com/iot/latest/developerguide/device-certs.html)
- [ESP32 Common SSL Errors](https://github.com/espressif/arduino-esp32/issues?q=ssl+error+-80)
