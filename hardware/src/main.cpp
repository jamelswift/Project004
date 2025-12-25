/*
 * ESP32 AWS IoT Relay Control
 * 2-Channel Relay connected via AWS IoT Core MQTT
 * 
 * Features:
 * - Connect to WiFi
 * - Load SSL certificates from SPIFFS
 * - Connect to AWS IoT Core MQTT broker
 * - Subscribe to control topics
 * - Publish device status
 * 
 * Connections:
 * - Relay Channel 1: GPIO 26 (RN1)
 * - Relay Channel 2: GPIO 27 (RN2)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <FS.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>

// ==================== WiFi Configuration ====================
const char* ssid = "Getzy";                    // WiFi SSID
const char* password = "Wipatsasicha7";        // WiFi password

// ==================== AWS IoT Configuration ====================
const char* aws_iot_endpoint = "a2zdea8txl0m71-ats.iot.ap-southeast-2.amazonaws.com";
const int aws_iot_port = 8883;
const char* thing_name = "esp32-relay-01";

// ==================== Pin Configuration ====================
const int RELAY_PIN_1 = 26;  // GPIO 26 (RN1)
const int RELAY_PIN_2 = 27;  // GPIO 27 (RN2)

// ==================== MQTT Topics ====================
String topic_control_ch1 = String(thing_name) + "/control/channel1";
String topic_control_ch2 = String(thing_name) + "/control/channel2";
String topic_status = String(thing_name) + "/status";
String topic_heartbeat = String(thing_name) + "/heartbeat";

// ==================== Global Variables ====================
WiFiClientSecure espClient;
PubSubClient client(espClient);
unsigned long lastHeartbeat = 0;
const unsigned long heartbeat_interval = 30000; // 30 seconds

// ==================== Function Declarations ====================
void setup_wifi();
void load_certificates();
void setup_mqtt();
void callback(char* topic, byte* payload, unsigned int length);
void reconnect();
void publish_status();
void control_relay(int channel, int state);
void print_certificate(const char* path);

// ==================== Setup ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("ESP32 AWS IoT Relay Control");
  Serial.println("========================================");
  
  // Initialize relay pins
  pinMode(RELAY_PIN_1, OUTPUT);
  pinMode(RELAY_PIN_2, OUTPUT);
  digitalWrite(RELAY_PIN_1, LOW);
  digitalWrite(RELAY_PIN_2, LOW);
  Serial.println("Relay pins initialized (LOW = OFF)");
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("ERROR: Failed to mount SPIFFS");
    while (1) delay(1000);
  }
  Serial.println("SPIFFS mounted successfully");
  
  // Load certificates
  load_certificates();
  
  // Setup WiFi
  setup_wifi();
  
  // Setup MQTT
  setup_mqtt();
}

// ==================== Main Loop ====================
void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Send heartbeat every 30 seconds
  if (millis() - lastHeartbeat > heartbeat_interval) {
    lastHeartbeat = millis();
    publish_status();
  }
  
  delay(100);
}

// ==================== WiFi Setup ====================
void setup_wifi() {
  Serial.println("\nConnecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nERROR: Failed to connect to WiFi");
    Serial.println("Check SSID and password in setup()");
  }
}

// ==================== Load Certificates ====================
void load_certificates() {
  Serial.println("\nLoading certificates from SPIFFS...");
  
  // Load client certificate
  if (SPIFFS.exists("/esp32-relay-01-certificate.pem.crt")) {
    File cert = SPIFFS.open("/esp32-relay-01-certificate.pem.crt");
    String certContent = cert.readString();
    espClient.setCertificate(certContent.c_str());
    cert.close();
    Serial.println("Client certificate loaded");
  } else {
    Serial.println("WARNING: Client certificate not found in SPIFFS");
  }
  
  // Load private key
  if (SPIFFS.exists("/esp32-relay-01-private.pem.key")) {
    File key = SPIFFS.open("/esp32-relay-01-private.pem.key");
    String keyContent = key.readString();
    espClient.setPrivateKey(keyContent.c_str());
    key.close();
    Serial.println("Private key loaded");
  } else {
    Serial.println("WARNING: Private key not found in SPIFFS");
  }
  
  // Load root CA
  if (SPIFFS.exists("/AmazonRootCA1.pem")) {
    File ca = SPIFFS.open("/AmazonRootCA1.pem");
    String caContent = ca.readString();
    espClient.setCACert(caContent.c_str());
    ca.close();
    Serial.println("Root CA loaded");
  } else {
    Serial.println("WARNING: Root CA not found in SPIFFS");
  }
}

// ==================== MQTT Setup ====================
void setup_mqtt() {
  client.setServer(aws_iot_endpoint, aws_iot_port);
  client.setCallback(callback);
  Serial.println("\nMQTT client configured");
  Serial.print("AWS IoT Endpoint: ");
  Serial.println(aws_iot_endpoint);
}

// ==================== Reconnect to MQTT ====================
void reconnect() {
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi();
    return;
  }
  
  if (!client.connected()) {
    Serial.print("Connecting to AWS IoT Core...");
    if (client.connect(thing_name)) {
      Serial.println(" Connected!");
      
      // Subscribe to control topics
      client.subscribe(topic_control_ch1.c_str());
      client.subscribe(topic_control_ch2.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(topic_control_ch1);
      Serial.print("Subscribed to: ");
      Serial.println(topic_control_ch2);
      
      // Publish initial status
      publish_status();
    } else {
      Serial.print(" FAILED (rc=");
      Serial.print(client.state());
      Serial.println(")");
      Serial.println("Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ==================== MQTT Callback ====================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON payload
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload, length);
  
  int state = doc["state"] | 0;
  Serial.print("State: ");
  Serial.println(state);
  
  // Control relays based on topic
  if (strcmp(topic, topic_control_ch1.c_str()) == 0) {
    control_relay(1, state);
  } else if (strcmp(topic, topic_control_ch2.c_str()) == 0) {
    control_relay(2, state);
  }
  
  // Publish status after control
  delay(200);
  publish_status();
}

// ==================== Control Relay ====================
void control_relay(int channel, int state) {
  int pin = (channel == 1) ? RELAY_PIN_1 : RELAY_PIN_2;
  Serial.print("Controlling relay ");
  Serial.print(channel);
  Serial.print(" to state ");
  Serial.println(state);
  
  if (state == 1) {
    digitalWrite(pin, HIGH);  // Turn ON
    Serial.print("Relay ");
    Serial.print(channel);
    Serial.println(" ON");
  } else {
    digitalWrite(pin, LOW);   // Turn OFF
    Serial.print("Relay ");
    Serial.print(channel);
    Serial.println(" OFF");
  }
}

// ==================== Publish Status ====================
void publish_status() {
  if (!client.connected()) return;
  
  // Get relay states
  int ch1_state = digitalRead(RELAY_PIN_1);
  int ch2_state = digitalRead(RELAY_PIN_2);
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["thing_name"] = thing_name;
  doc["channel1"] = ch1_state;
  doc["channel2"] = ch2_state;
  doc["timestamp"] = millis();
  
  // Serialize and publish
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish(topic_status.c_str(), buffer);
  
  Serial.print("Status published: ");
  Serial.println(buffer);
}
