/**
 * Auto-Register for IoT Devices
 * Include this in your ESP32 code to automatically register with backend
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ==================== AUTO-REGISTER CONFIGURATION ====================
// Change these to your setup
const char* BACKEND_URL = "http://192.168.1.100:3000";  // Backend API URL
const char* DEVICE_NAME = "ESP32_Relay_Device_01";       // Device display name
const char* DEVICE_TYPE = "relay";                        // light, sensor, actuator, relay
const int AUTO_REGISTER_INTERVAL = 60000;                 // Register every 60 seconds (until success)

// ==================== AUTO-REGISTER VARIABLES ====================
static bool registrationAttempted = false;
static bool registrationSuccess = false;
static unsigned long lastRegistrationAttempt = 0;

/**
 * Get MAC address of ESP32
 */
String getMacAddress() {
  uint8_t mac[6];
  esp_efuse_mac_get_default(mac);
  String result;
  for (int i = 0; i < 6; i++) {
    if (mac[i] < 16) result += "0";
    result += String(mac[i], HEX);
    if (i < 5) result += ":";
  }
  return result;
}

/**
 * Get local IP address
 */
String getLocalIP() {
  return WiFi.localIP().toString();
}

/**
 * Auto-register device with backend
 * Call this from setup() after WiFi connects
 */
void autoRegisterDevice() {
  unsigned long now = millis();
  
  // Don't try to register too frequently (wait 5 seconds between attempts)
  if (registrationAttempted && (now - lastRegistrationAttempt) < 5000) {
    return;
  }
  
  // If already registered successfully, don't register again
  if (registrationSuccess) {
    return;
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[AutoRegister] WiFi not connected, skipping registration");
    return;
  }

  Serial.println("[AutoRegister] Attempting device registration...");
  lastRegistrationAttempt = now;
  registrationAttempted = true;

  HTTPClient http;
  String registerUrl = String(BACKEND_URL) + "/api/devices/auto-register";
  
  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"name\":\"" + String(DEVICE_NAME) + "\",";
  jsonPayload += "\"deviceType\":\"" + String(DEVICE_TYPE) + "\",";
  jsonPayload += "\"ipAddress\":\"" + getLocalIP() + "\",";
  jsonPayload += "\"macAddress\":\"" + getMacAddress() + "\",";
  jsonPayload += "\"firmwareVersion\":\"1.0.0\"";
  jsonPayload += "}";

  Serial.print("[AutoRegister] Sending to: ");
  Serial.println(registerUrl);
  Serial.print("[AutoRegister] Payload: ");
  Serial.println(jsonPayload);

  http.begin(registerUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode == 201 || httpResponseCode == 200) {
    String response = http.getString();
    Serial.print("[AutoRegister] ✅ Registration successful! Response: ");
    Serial.println(response);
    registrationSuccess = true;
  } else {
    Serial.print("[AutoRegister] ❌ Registration failed. HTTP code: ");
    Serial.println(httpResponseCode);
    Serial.print("[AutoRegister] Response: ");
    Serial.println(http.getString());
  }
  
  http.end();
}

/**
 * Call this from loop() to continuously try registration until success
 */
void updateAutoRegister() {
  // If not yet registered, keep trying
  if (!registrationSuccess && (millis() - lastRegistrationAttempt) > AUTO_REGISTER_INTERVAL) {
    registrationAttempted = false;  // Reset to allow retry
    autoRegisterDevice();
  }
}

/**
 * Send heartbeat to keep device alive in backend
 */
void sendDeviceHeartbeat() {
  if (!registrationSuccess || WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String heartbeatUrl = String(BACKEND_URL) + "/api/devices/heartbeat";
  
  String jsonPayload = "{";
  jsonPayload += "\"ipAddress\":\"" + getLocalIP() + "\",";
  jsonPayload += "\"status\":\"online\"";
  jsonPayload += "}";

  http.begin(heartbeatUrl);
  http.addHeader("Content-Type", "application/json");
  http.POST(jsonPayload);
  http.end();
}

/**
 * Check if device is registered
 */
bool isDeviceRegistered() {
  return registrationSuccess;
}
