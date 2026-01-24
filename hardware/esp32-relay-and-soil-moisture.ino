/*
 * ESP32 - 2-Channel Relay Control + Soil Moisture Sensor
 * - Relay control on GPIO 26, 27 (polling backend every 1 second)
 * - Soil moisture sensor on GPIO 34 (reading every 30 seconds)
 * - Send sensor data to backend
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== WiFi Configuration =====
const char* WIFI_SSID = "GETZY";
const char* WIFI_PASSWORD = "Wipatsasicha7";

// ===== Backend API Configuration =====
const char* RELAY_STATE_URL = "http://192.168.1.166:3000/api/relay/state";
const char* SOIL_MOISTURE_URL = "http://192.168.1.166:3000/api/sensors/soil-moisture";

// ===== GPIO Configuration =====
#define RELAY1_PIN 26              // Relay 1
#define RELAY2_PIN 27              // Relay 2
#define SOIL_MOISTURE_PIN 34       // ADC pin for soil moisture
#define LED_PIN 2                  // On-board LED indicator

// ===== Relay Configuration =====
bool RELAY_ACTIVE_LOW = false;  // false = HIGH for ON
const long RELAY_POLL_INTERVAL = 1000;  // Poll every 1 second

// ===== Soil Moisture Configuration =====
const int SOIL_READ_INTERVAL = 30000;   // Read every 30 seconds
const int NUM_SOIL_SAMPLES = 10;        // Average samples
const int DRY_VALUE = 4095;             // ADC when dry
const int WET_VALUE = 1448;             // ADC when wet

// ===== State Tracking =====
bool relay1On = false;
bool relay2On = false;
unsigned long lastRelayPoll = 0;
unsigned long lastSoilRead = 0;

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
  
  Serial.println("\n\n[Setup] ESP32 Relay + Soil Moisture Controller");
  
  // GPIO setup
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Turn off all relays at startup
  setRelay(RELAY1_PIN, false);
  setRelay(RELAY2_PIN, false);
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("[GPIO] Initialized - Relay1: GPIO26, Relay2: GPIO27, Soil: GPIO34");
  
  // Connect WiFi
  connectWiFi();
  
  Serial.println("[Setup] Ready!");
}

void loop() {
  unsigned long now = millis();
  
  // Poll relay state every 1 second
  if (now - lastRelayPoll >= RELAY_POLL_INTERVAL) {
    lastRelayPoll = now;
    fetchAndApplyRelayState();
  }
  
  // Read soil moisture every 30 seconds
  if (now - lastSoilRead >= SOIL_READ_INTERVAL) {
    lastSoilRead = now;
    readAndSendSoilMoisture();
  }
  
  delay(10);
}

// ============================================================================
// RELAY CONTROL FUNCTIONS
// ============================================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection failed");
  }
}

void fetchAndApplyRelayState() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Relay] WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(RELAY_STATE_URL);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    
    DynamicJsonDocument doc(256);
    deserializeJson(doc, response);
    
    bool newRelay1 = doc["relay1"].as<String>() == "on";
    bool newRelay2 = doc["relay2"].as<String>() == "on";
    
    if (newRelay1 != relay1On) {
      relay1On = newRelay1;
      setRelay(RELAY1_PIN, relay1On);
      Serial.print("[Relay] Channel 1: ");
      Serial.println(relay1On ? "ON" : "OFF");
    }
    
    if (newRelay2 != relay2On) {
      relay2On = newRelay2;
      setRelay(RELAY2_PIN, relay2On);
      Serial.print("[Relay] Channel 2: ");
      Serial.println(relay2On ? "ON" : "OFF");
    }
  } else {
    Serial.print("[Relay] HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// ============================================================================
// SOIL MOISTURE SENSOR FUNCTIONS
// ============================================================================

int readSoilMoisture() {
  int total = 0;
  
  // Take multiple samples and average
  for (int i = 0; i < NUM_SOIL_SAMPLES; i++) {
    total += analogRead(SOIL_MOISTURE_PIN);
    delay(10);
  }
  
  return total / NUM_SOIL_SAMPLES;
}

float calculateMoisturePercentage(int rawValue) {
  // Convert ADC value to percentage (0-100%)
  float percentage = map(rawValue, WET_VALUE, DRY_VALUE, 100, 0);
  
  // Constrain to 0-100%
  percentage = constrain(percentage, 0, 100);
  
  return percentage;
}

void readAndSendSoilMoisture() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Soil] WiFi not connected");
    return;
  }
  
  // Read sensor
  int rawValue = readSoilMoisture();
  float moisturePercent = calculateMoisturePercentage(rawValue);
  
  Serial.print("[Soil] Raw: ");
  Serial.print(rawValue);
  Serial.print(" | Percentage: ");
  Serial.print(moisturePercent);
  Serial.println("%");
  
  // Send to backend
  HTTPClient http;
  http.begin(SOIL_MOISTURE_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["sensorId"] = "SOIL_MOISTURE_001";
  doc["type"] = "soil_moisture";
  doc["value"] = moisturePercent;
  doc["rawValue"] = rawValue;
  doc["unit"] = "%";
  doc["location"] = "Garden";
  
  // Add timestamp
  char timestamp[30];
  snprintf(timestamp, sizeof(timestamp), "2026-01-24T%02d:%02d:%02dZ", 
           (millis() / 1000 / 3600) % 24,
           (millis() / 1000 / 60) % 60,
           (millis() / 1000) % 60);
  doc["timestamp"] = timestamp;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.println("[Soil] Data sent successfully");
    
    // Blink LED to indicate successful transmission
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.print("[Soil] HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}
