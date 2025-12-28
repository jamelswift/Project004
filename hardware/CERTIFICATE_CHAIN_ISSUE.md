# AWS IoT Core SSL Error -80 (0050) - Next Steps

## Current Status
✅ **All diagnostics passing:**
- Time synced correctly  
- WiFi connected  
- All certificates loaded with correct sizes
- AWS IoT endpoint correct

❌ **Still failing with SSL error -80**

This indicates a **certificate chain validation issue**, not a time or basic configuration problem.

## Diagnosis

Error -80 in ESP32 SSL typically means:
1. ❌ Certificate date mismatch (but we already checked this)
2. ❌ Invalid certificate format (but files load correctly)
3. ✅ **Most likely: Missing intermediate certificate or certificate chain issue**

### Why This Happens
AWS IoT device certificates are signed by an **intermediate CA**, not directly by the Root CA. The certificate chain should be:

```
Device Certificate (device.pem.crt)
    ↓ (signed by)
AWS IoT Intermediate CA
    ↓ (signed by)
Amazon Root CA 1 (AmazonRootCA1.pem)
```

The ESP32 is only checking:
```
Device Certificate ← (missing Intermediate CA) → Root CA
```

## Solution Options

### Option 1: Create a Full Certificate Chain File (Recommended)

Your device.pem.crt file should be a **full chain** that includes both:
1. Your device certificate
2. The intermediate certificate

Downlaod from AWS:
1. Go to AWS IoT Core Console → Certificates
2. Find your certificate
3. Download it as `.pem` file
4. The downloaded file usually contains the full chain

Or combine manually:
```bash
# If you have the intermediate cert, combine:
cat device.pem.crt intermediate-ca.pem > device.pem.crt.chain

# Use device.pem.crt.chain as your device certificate in code
```

### Option 2: Manually Enable the Missing Certificates
If you don't have the intermediate, regenerate from AWS:

```bash
# Download your certificate again from AWS with "both" options selected
# AWS should give you the full chain
```

### Option 3: Try Different AWS Root CA Versions

There are multiple Root CA versions. Try this one (newer):

```cpp
// AmazonRootCA3.pem (for newer endpoints)
// Download from: https://www.amazontrust.com/repository/AmazonRootCA3.pem
```

### Option 4: Debug ESP32 SSL More Deeply

Add temporary debug output:

```cpp
// In load_certificates(), add before connect:
espClient.setDebugCB([](const char* file, int line, const char* msg) {
  Serial.printf("[%s:%d] %s\n", file, line, msg);
});
espClient.setDebug(4);  // Maximum debug level
```

## Action Plan

1. **Re-download your AWS IoT certificate** from the AWS Console
   - Go to AWS IoT Core → Certificates → Your certificate
   - Select "Download certificate" (should be `.pem` format)
   - This file should contain the full chain

2. **Replace `device.pem.crt`** in `/hardware/data/` with the newly downloaded file

3. **Re-upload to SPIFFS**:
   ```bash
   cd hardware
   pio run -t uploadfs
   ```

4. **Restart the ESP32** and monitor

If you still see error -80, then:
5. **Check with AWS** - verify the certificate is:
   - Still active (not revoked)
   - Attached to the correct Thing
   - Has correct policies attached

## Files to Check

- [device.pem.crt](hardware/data/device.pem.crt) - Device certificate (may be incomplete)
- [AmazonRootCA1.pem](hardware/data/AmazonRootCA1.pem) - Root CA
- [private.pem.key](hardware/data/private.pem.key) - Private key

## Test Commands (once openssl available)
```bash
# Verify certificate chain
openssl verify -CAfile AmazonRootCA1.pem device.pem.crt

# Check certificate dates
openssl x509 -in device.pem.crt -noout -dates

# Check which CA signed the device cert
openssl x509 -in device.pem.crt -noout -issuer

# Try connecting with openssl
openssl s_client -connect a2zdea8txl0m71-ats.iot.ap-southeast-1.amazonaws.com:8883 \
  -cert device.pem.crt \
  -key private.pem.key \
  -CAfile AmazonRootCA1.pem
```

## AWS IoT Policy Check

Make sure your certificate has the correct policy:

```bash
# Check what policies are attached
aws iot list-principal-policies --principal arn:aws:iot:ap-southeast-1:ACCOUNT:cert/CERT_ID

# Should output an IoT policy with permissions like:
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Action": "iot:*",
#     "Resource": "*"
#   }]
# }
```

## Next Steps

1. Download fresh certificate from AWS
2. Upload to device
3. Restart ESP32
4. Check if error persists

If still failing after fresh certificate, the issue may be with AWS policies or endpoint configuration.
