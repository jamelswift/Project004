/*
 * ESP32 - AWS IoT Core MQTT Connection
 * - Relay control (GPIO 26, 27) via MQTT messages
 * - Soil moisture sensor (GPIO 34) publishing to AWS IoT Core
 * - Real-time control from Backend via MQTT
 * - All communication through AWS IoT Core with certificate authentication
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include "certs.h"  // Contains AWS IoT certificates

// ===== WiFi Configuration =====
const char* WIFI_SSID = "GETZY";
const char* WIFI_PASSWORD = "Wipatsasicha7";

// ===== AWS IoT Core Configuration =====
const char* AWS_IOT_ENDPOINT = "a2zdea8xl0m71-ats.iot.ap-southeast-1.amazonaws.com";
const int AWS_IOT_PORT = 8883;
const char* THING_NAME = "ESP32_RELAY_MOISTURE";

// ===== GPIO Configuration =====
#define RELAY1_PIN 26              // Relay 1 (LED on breadboard)
#define RELAY2_PIN 27              // Relay 2 (LED on breadboard)
#define SOIL_MOISTURE_PIN 34       // ADC pin for soil moisture
#define LED_PIN 2                  // On-board LED indicator

// ===== Timing Configuration =====
const long SOIL_READ_INTERVAL = 30000;   // Read every 30 seconds
const int NUM_SOIL_SAMPLES = 10;         // Average samples
const int DRY_VALUE = 4095;              // ADC when dry
const int WET_VALUE = 1448;              // ADC when wet

// ===== MQTT Topics =====
String CONTROL_TOPIC;      // $aws/things/ESP32_RELAY_MOISTURE/shadow/update/delta
String STATUS_TOPIC;       // $aws/things/ESP32_RELAY_MOISTURE/shadow/update
String HEARTBEAT_TOPIC;    // esp32/heartbeat
String SOIL_TOPIC;         // esp32/soil-moisture

// ===== State Tracking =====
bool relay1On = false;
bool relay2On = false;
unsigned long lastSoilRead = 0;
unsigned long lastHeartbeat = 0;

WiFiClientSecure net;
MQTTClient client(512);

// ===== Certificate Setup =====
void setupCertificates() {
  // Load certificates from certs.h
  net.setCACert(AWS_CERT_CA);
  net.setClientCert(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);
}

void setRelay(int pin, bool on) {
  digitalWrite(pin, on ? HIGH : LOW);
  Serial.print("[Relay] GPIO");
  Serial.print(pin);
  Serial.println(on ? " -> ON" : " -> OFF");
}

void messageHandler(String &topic, String &payload) {
  Serial.println("\n[MQTT] Message received:");
  Serial.print("  Topic: ");
  Serial.println(topic);
  Serial.print("  Payload: ");
  Serial.println(payload);

  // Parse JSON payload
  DynamicJsonDocument doc(512);
  deserializeJson(doc, payload);

  // Handle Thing Shadow delta updates (desired state changes)
  if (topic.endsWith("/shadow/update/delta")) {
    if (doc["state"]["relay1"].is<bool>()) {
      bool newRelay1 = doc["state"]["relay1"].as<bool>();
      if (newRelay1 != relay1On) {
        relay1On = newRelay1;
        setRelay(RELAY1_PIN, relay1On);
        updateShadowReported();
      }
    }
    if (doc["state"]["relay2"].is<bool>()) {
      bool newRelay2 = doc["state"]["relay2"].as<bool>();
      if (newRelay2 != relay2On) {
        relay2On = newRelay2;
        setRelay(RELAY2_PIN, relay2On);
        updateShadowReported();
      }
    }
  }

  // Handle direct relay control messages
  if (topic == CONTROL_TOPIC) {
    if (doc["relay1"].is<bool>()) {
      relay1On = doc["relay1"].as<bool>();
      setRelay(RELAY1_PIN, relay1On);
    }
    if (doc["relay2"].is<bool>()) {
      relay2On = doc["relay2"].as<bool>();
      setRelay(RELAY2_PIN, relay2On);
    }
  }
}

void connectAWS() {
  Serial.println("[AWS] Connecting to AWS IoT Core...");

  // MQTT callbacks
  client.onMessage(messageHandler);

  // Connect to AWS IoT Core
  if (!client.connect(THING_NAME)) {
    Serial.println("[AWS] ❌ Connection failed");
    return;
  }

  Serial.println("[AWS] ✅ Connected to AWS IoT Core");

  // Subscribe to control topics
  String shadowDeltaTopic = "$aws/things/" + String(THING_NAME) + "/shadow/update/delta";
  client.subscribe(shadowDeltaTopic);
  client.subscribe(CONTROL_TOPIC);

  Serial.println("[AWS] 📡 Subscribed to control topics");

  // Publish initial status
  updateShadowReported();
  sendHeartbeat();
}

void updateShadowReported() {
  // Update Thing Shadow with current state
  DynamicJsonDocument shadowDoc(256);
  shadowDoc["state"]["reported"]["relay1"] = relay1On;
  shadowDoc["state"]["reported"]["relay2"] = relay2On;
  shadowDoc["state"]["reported"]["timestamp"] = millis();

  String shadowPayload;
  serializeJson(shadowDoc, shadowPayload);

  String shadowTopic = "$aws/things/" + String(THING_NAME) + "/shadow/update";
  client.publish(shadowTopic, shadowPayload);

  Serial.println("[Shadow] ✅ Reported state updated");
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["timestamp"] = millis();
  doc["relay1"] = relay1On;
  doc["relay2"] = relay2On;
  doc["deviceId"] = THING_NAME;

  String payload;
  serializeJson(doc, payload);

  client.publish(HEARTBEAT_TOPIC, payload);
  Serial.println("[Heartbeat] 💓 Sent");
}

void readAndSendSoilMoisture() {
  if (!client.connected()) {
    Serial.println("[Soil] MQTT not connected");
    return;
  }

  // Read multiple samples and average
  int totalValue = 0;
  for (int i = 0; i < NUM_SOIL_SAMPLES; i++) {
    totalValue += analogRead(SOIL_MOISTURE_PIN);
    delay(10);
  }
  int avgValue = totalValue / NUM_SOIL_SAMPLES;

  // Convert to percentage (0-100%)
  int moisturePercent = map(avgValue, DRY_VALUE, WET_VALUE, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // Create payload
  DynamicJsonDocument doc(256);
  doc["sensorId"] = "ESP32_SOIL_001";
  doc["type"] = "soil_moisture";
  doc["value"] = moisturePercent;
  doc["rawValue"] = avgValue;
  doc["unit"] = "%";
  doc["location"] = "Garden";
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  // Publish to soil moisture topic
  client.publish(SOIL_TOPIC, payload);

  Serial.print("[Soil] 💧 Published: ");
  Serial.print(moisturePercent);
  Serial.println("%");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n[Setup] ESP32 AWS IoT Core MQTT Client");

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

  // Setup MQTT topics
  CONTROL_TOPIC = "esp32/control/" + String(THING_NAME);
  STATUS_TOPIC = "esp32/status/" + String(THING_NAME);
  HEARTBEAT_TOPIC = "esp32/heartbeat";
  SOIL_TOPIC = "esp32/soil-moisture";

  // Setup certificates
  setupCertificates();

  // Setup MQTT client
  client.setHost(AWS_IOT_ENDPOINT, AWS_IOT_PORT);

  // Connect WiFi
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
    return;
  }

  // Connect to AWS IoT Core
  delay(1000);
  connectAWS();

  Serial.println("[Setup] Ready!");
}

void loop() {
  unsigned long now = millis();

  // Ensure MQTT connection
  if (!client.connected()) {
    connectAWS();
  } else {
    client.loop();
  }

  // Read soil moisture every 30 seconds
  if (now - lastSoilRead >= SOIL_READ_INTERVAL) {
    lastSoilRead = now;
    readAndSendSoilMoisture();
  }

  // Send heartbeat every 60 seconds
  if (now - lastHeartbeat >= 60000) {
    lastHeartbeat = now;
    sendHeartbeat();
  }

  delay(100);
}
