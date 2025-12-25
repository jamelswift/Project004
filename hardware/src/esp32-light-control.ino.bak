/*
 * ESP32 - 2-Channel Relay Control via HTTP
 * ดึงสถานะรีเลย์จาก Backend และควบคุม GPIO 26, 27
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== WiFi Configuration =====
const char* WIFI_SSID = "Getzy";
const char* WIFI_PASSWORD = "Wipatsasicha7";

// ===== Backend API Configuration =====
const char* STATE_URL = "http://172.20.10.3:5000/api/relay/state"; // Backend on laptop (Getzy Wi‑Fi)
const long POLL_INTERVAL = 1000;  // ดึงสถานะทุก 1 วิ

// ===== GPIO Relay Configuration =====
#define RELAY1_PIN 26
#define RELAY2_PIN 27
#define LED_PIN 2            // On-board LED mirror

// Many 2-channel relay modules are active-LOW
// Set true if "LOW = ON", false if "HIGH = ON"
bool RELAY_ACTIVE_LOW = false;

// ===== State Tracking =====
bool relay1On = false;
bool relay2On = false;
unsigned long lastPoll = 0;

void setRelay(int pin, bool on) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, on ? LOW : HIGH);
  } else {
    digitalWrite(pin, on ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n\n[Setup] ESP32 2-Channel Relay Controller");
  
  // GPIO setup
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Turn off all relays at startup
  setRelay(RELAY1_PIN, false);
  setRelay(RELAY2_PIN, false);
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("[GPIO] Initialized (relays OFF)");
  
  // Connect WiFi
  connectWiFi();
  
  Serial.println("[Setup] Ready!");
}

String hostFromUrl(const char *url) {
  String s(url);
  int start = s.indexOf("://");
  start = (start >= 0) ? start + 3 : 0;
  int end = s.indexOf('/', start);
  if (end < 0) end = s.length();
  String hostPort = s.substring(start, end);
  int colon = hostPort.indexOf(':');
  return colon >= 0 ? hostPort.substring(0, colon) : hostPort;
}

void loop() {
  unsigned long now = millis();
  
  // Poll backend every POLL_INTERVAL ms
  if (now - lastPoll >= POLL_INTERVAL) {
    lastPoll = now;
    fetchAndApplyRelayState();
  }
  
  delay(10);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);        // improve reliability on some APs
  WiFi.persistent(false);      // don't write creds to NVS repeatedly
  WiFi.setAutoReconnect(true); // auto reconnect when AP is available

  Serial.printf("[WiFi] Connecting to %s...\n", WIFI_SSID);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED) {
    attempt++;
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
      Serial.print(".");
      delay(500);
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println();
      Serial.printf("[WiFi] ✅ Connected: %s | IP %s\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
      break;
    }

    Serial.println();
    Serial.printf("[WiFi] ❌ Failed (attempt %d). Scanning...\n", attempt);

    int n = WiFi.scanNetworks();
    if (n <= 0) {
      Serial.println("[WiFi] Scan failed or no networks found");
    } else {
      Serial.printf("[WiFi] Found %d networks:\n", n);
      for (int i = 0; i < n && i < 10; i++) {
        String ssid = WiFi.SSID(i);
        int rssi = WiFi.RSSI(i);
        int ch = WiFi.channel(i);
        bool isTarget = ssid == String(WIFI_SSID);
        Serial.printf("  - %s (ch %d, RSSI %d)%s\n", ssid.c_str(), ch, rssi, isTarget ? " \u2190 target" : "");
      }
      Serial.println("[WiFi] Tip: ESP32 only supports 2.4GHz networks.");
    }

    WiFi.disconnect(true);
    delay(3000);
  }
}

void fetchAndApplyRelayState() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi disconnected, skipping poll");
    return;
  }
  
  HTTPClient http;
  http.begin(STATE_URL);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.print("[HTTP] State: ");
    Serial.println(payload);
    
    // Parse JSON
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      bool newRelay1 = doc["relay1"] | "off";
      bool newRelay2 = doc["relay2"] | "off";
      
      // Handle string or boolean
      if (doc["relay1"].is<const char*>()) {
        newRelay1 = strcmp(doc["relay1"], "on") == 0;
      } else if (doc["relay1"].is<bool>()) {
        newRelay1 = doc["relay1"].as<bool>();
      }
      
      if (doc["relay2"].is<const char*>()) {
        newRelay2 = strcmp(doc["relay2"], "on") == 0;
      } else if (doc["relay2"].is<bool>()) {
        newRelay2 = doc["relay2"].as<bool>();
      }
      
      // Apply changes only if state changed
      if (newRelay1 != relay1On) {
        relay1On = newRelay1;
        setRelay(RELAY1_PIN, relay1On);
        Serial.println(String("[Relay] CH1: ") + (relay1On ? "ON" : "OFF"));
      }
      
      if (newRelay2 != relay2On) {
        relay2On = newRelay2;
        setRelay(RELAY2_PIN, relay2On);
        Serial.println(String("[Relay] CH2: ") + (relay2On ? "ON" : "OFF"));
      }
      
      // Mirror to on-board LED (ON if any relay is ON)
      digitalWrite(LED_PIN, (relay1On || relay2On) ? HIGH : LOW);
      
    } else {
      Serial.println("[HTTP] ❌ JSON parse error");
    }
  } else {
    Serial.print("[HTTP] ❌ Error code: ");
    Serial.println(httpCode);
  }
  
  http.end();

  // Warn if target URL host equals our own IP (likely misconfigured)
  String targetHost = hostFromUrl(STATE_URL);
  String selfIp = WiFi.localIP().toString();
  if (targetHost == selfIp) {
    static bool warned = false;
    if (!warned) {
      Serial.printf("[HTTP] ⚠️ STATE_URL host (%s) equals device IP (%s). Update to backend IP.\n",
                    targetHost.c_str(), selfIp.c_str());
      warned = true;
    }
  }
}
