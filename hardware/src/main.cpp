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
// Force MQTT protocol to 3.1.1 for AWS IoT
#define MQTT_VERSION MQTT_VERSION_3_1_1
#include <PubSubClient.h>
#include <FS.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <time.h>

// ==================== AWS Root CA Certificate (Embedded) ====================
// AmazonRootCA1.pem - DO NOT LOAD FROM SPIFFS!
// This ensures we always use the correct, trusted root CA
static const char AWS_ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

// ==================== Device Certificate (Embedded) ====================
// esp32-relay-01-certificate.pem.crt - Use the actual ESP32 device certificate
// This is embedded to avoid any SPIFFS file corruption issues
static const char AWS_DEVICE_CERT[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUey6+22CnSZUBwv33f9uKqyF2+4gwDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI1MTEyOTIxMTg1
OFoXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOCS9dRZMPqsQC7ljK/A
v2gXL/sVK0NCdQOVcCAH83fs9r6FmIVDjdbNnu8Q29rXYn78cM2rYUmvfOsnN9K8
6AdNNX1/rqy2g76shdHGNwRVhSzMtUP1r1QstJj8L/RLmQ3yTBG+XQZxbGQrXu+b
LNsit0yLbHyI/IsHs00IpqcqCv8OqEW0synmZWTYXDxSSc3SBOYE1qg0wjMMhArj
/EmoClmS25/xhzTpr3ykF31TgBob5fcZhyWzYiY2Pn0btTK/E7uw9ny/2UdguAxE
IJf7+dwp1F4AsTpxhuIaHBRjSX5fpRZyO7FqyPAVSkBbobUCwKfasHDlBOCwrd/A
U8UCAwEAAaNgMF4wHwYDVR0jBBgwFoAUYu06A5zotJkLJa7wVZDQ0HOeSEcwHQYD
VR0OBBYEFCrAizIpj2uSMeAvyRUnpKAwImAUMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQCQ+aQ2qRwYcRgVeTyUlfBzD7+g
fOLYIx8xFhipB+sFm8yDUaHWoUXXsXPg+n4noh0bfEBlqc/i5qKqPyFI16a/XhCS
uhWhF55v4uG/rpQfVkFF4AtU+8ub8+ApaUvnwLVpIFSO4qsof96Om0vwhlcHfiZw
RcStFXCRhpitLMVCsvNYzF1ApysxHQ+2FuctlLcN6eJ9aNKf+AUsAb5p7IT+3V3f
scOu3102ohLBhi4XgxiF5XY4g/qN/EXa6lUF/DtkfUEKCMtF+XXPni67+RVW9PP9
SNllH9ycwLGPZxDZ3L7QjZ3MjlpFVt5QK1mwQvGUtYGZHPTN5Bpx+JZ3TEQ/
-----END CERTIFICATE-----
)EOF";

// ==================== Device Private Key (Embedded) ====================
// esp32-relay-01-private.pem.key - The private key matching the device certificate
// This is embedded to avoid any SPIFFS file corruption issues
static const char AWS_DEVICE_KEY[] PROGMEM = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4JL11Fkw+qxALuWMr8C/aBcv+xUrQ0J1A5VwIAfzd+z2voWY
hUON1s2e7xDb2tdifvxwzathSa986yc30rzoB001fX+urLaDvqyF0cY3BFWFLMy1
Q/WvVCy0mPwv9EuZDfJMEb5dBnFsZCte75ss2yK3TItsfIj8iwezTQimpyoK/w6o
RbSzKeZlZNhcPFJJzdIE5gTWqDTCMwyECuP8SagKWZLbn/GHNOmvfKQXfVOAGhvl
9xmHJbNiJjY+fRu1Mr8Tu7D2fL/ZR2C4DEQgl/v53CnUXgCxOnGG4hocFGNJfl+l
FnI7sWrI8BVKQFuhtQLAp9qwcOUE4LCt38BTxQIDAQABAoIBAHt1r3nvErMskRh3
D/HrOA8EeFdDmwYd+fBfbkXduSab+kZhcakJq2eEoTRygzt7H2YKaAVZi2GT/UvV
wqWzPqgM9TQqRqAisqjXdbYOj15tmYo4fAqBfcL71MkqEz7tdJYrN1Cl48RQBLPI
+CcnmvBZ1IVbPOf180iHkjXuZJgOyAM6ZTnuEFMiTYxiRFAo3UFLO66lcpTPS7yr
aY5M2eskByXHxFr3V7mMhsYt5uQZkOggnFj7ViLT9t0VTZSM6h4peo9xXbKwfjJM
Icr7Zk3qFu3icOY69Ffj3Adh/ANxrsvYSNwDakPaPQzvbiqDyzookem9KPfGXDKL
YPqbEp0CgYEA/GupPqZJWT4kxDW1cezfuIPYDk8K4uCizUANe7hxw9J6iQ96PbDa
eiNs7tdtUQ7QzUi/tpmUEcv3oDeGtIwUo6sxS5ui2BsEQlB6tPZkR5NwYCxhAXit
s02FVRXdvrZoFBF1usD8ljYcdv2GD4F8/JK6LaRpGuKI6HXa/1JvtesCgYEA48I1
7I75tLR+SXo6ORz4N4hYEwMcwotlPvAWzGWy6d92wnCqMO6duo+y0n00sVfG8+tn
nw7LvnpeJXFm/sbEswxy4fmk2fMLL2Bh+qaJ6cNO1g+yjMoOBA0qWl/8MXIXeOMp
OCgyP/U+uXbzZLXcQJtz/qo8KwERHSSLSrUMQQ8CgYEAzmrYLyRajQE1ncJyC6Ty
WnhuwVzAAUJDv+bmX8s4NTO1AspGY5ZxQzofBb3jZkrgU09vf0pd/KO4byuZG6IF
6sW+/R5b769AL16SydNHtASM/Aiulz5xhVQaebb069VMjUSt6reQluHPKzstWxa/
9+ehGlv9m3+vB7IBEZP/SFsCgYEAtvnw7oKS8+1Jw+gxXG78r0iXUXbfpR/uEBk8
h6twiFmiBGYVJMie6SHHDTnPmmYljRLjJbLyVq3icvxfPXIc1qe6p/cyzHJo2v/4
1zDyfV4OOQVVcaxmhDS7gO26I1NArjr5g4cvj5iMct2wfoloUHNTRhYnznjF8f7I
9RTsqlsCgYA3yM1L9C5WAfi2//gMA3/m3pd2oEn/vyEVA2yx1++QU5yXQZpgLwAC
n8YCjXTOFmI9uYwd5mZeNcMtWukQSut5U6PDAma4ML05VDtqRL3zalKt8jeF6/n4
4eBhsGX6Uuriiik64IelJMFQl+Fz7gnoiCLcAxC59kAlpSC4dlr65A==
-----END RSA PRIVATE KEY-----
)EOF";

// ==================== WiFi Configuration ====================
const char* ssid = "Getzy";
const char* password = "Wipatsasicha7";

// ==================== AWS IoT Configuration ====================
// ใช้ endpoint สิงคโปร์ตามที่ตั้งค่าระบบไว้
const char* aws_iot_endpoint = "a2zdea8txl0m71-ats.iot.ap-southeast-1.amazonaws.com";
const int aws_iot_port = 8883;
const char* thing_name = "esp32-relay-01";

// ==================== Pin Configuration ====================
const int RELAY_PIN_1 = 26;  // GPIO 26 (RN1)
const int RELAY_PIN_2 = 27;  // GPIO 27 (RN2)

// ==================== MQTT Topics ====================
// Command / State topics ให้ตรงกับ backend (publish: <deviceId>/command, state: <deviceId>/state)
String topic_command = String(thing_name) + "/command";
String topic_state   = String(thing_name) + "/state";
String topic_heartbeat = String(thing_name) + "/heartbeat";

// ==================== Global Variables ====================
WiFiClientSecure espClient;
PubSubClient client(espClient);
unsigned long lastHeartbeat = 0;
const unsigned long heartbeat_interval = 30000; // 30 seconds

// ✅ All TLS certificates are now embedded in code - no global String variables needed

// Read entire file into a String (null-terminated when using c_str())
String readFileToString(const char* path) {
  File f = SPIFFS.open(path, "r");
  if (!f) {
    Serial.print("Failed to open file: ");
    Serial.println(path);
    return "";
  }
  String content;
  while (f.available()) {
    content += static_cast<char>(f.read());
  }
  f.close();
  return content;
}

// ==================== Function Declarations ====================
void setup_wifi();
void sync_time();
void load_certificates();
void setup_mqtt();
void callback(char* topic, byte* payload, unsigned int length);
void reconnect();
void publish_status();
void control_relay(int channel, int state);
void print_certificate(const char* path);
void diagnose_tls_issue();


// ==================== Setup ====================
void setup() {
  Serial.begin(115200);
  delay(500);  // Wait for serial to stabilize
  
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
  
  // Setup WiFi
  setup_wifi();
  
  // Sync time with NTP (CRITICAL for AWS IoT TLS - ERROR -80 usually means bad time)
  sync_time();
  
  // Load certificates
  load_certificates();
  
  // Print diagnostics
  diagnose_tls_issue();
  
  // Setup MQTT
  setup_mqtt();
}

// ==================== Main Loop ====================
void loop() {
  // CRITICAL: Call loop() FIRST, always!
  int loopResult = client.loop();  // Returns true if connected
  
  // Check connection and reconnect if needed
  if (!client.connected()) {
    static unsigned long lastReconnectAttempt = 0;
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      Serial.println("[Loop] Client disconnected, attempting reconnect...");
      reconnect();
    }
  } else {
    // Send heartbeat every 60 seconds (reduced frequency)
    static unsigned long lastHeartbeatLog = 0;
    if (millis() - lastHeartbeat > 60000) {
      lastHeartbeat = millis();
      Serial.println("[Heartbeat] Publishing status...");
      publish_status();
      lastHeartbeatLog = millis();
    }
    
    // Log connection status every 30 seconds
    if (millis() - lastHeartbeatLog > 30000 && lastHeartbeatLog > 0) {
      lastHeartbeatLog = millis();
      Serial.println("[Status] Connected, listening for commands");
    }
  }
  
  delay(5);  // Minimal delay for faster MQTT callback response
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

// ==================== Time Synchronization ====================
void sync_time() {
  Serial.println("\nSynchronizing time with NTP...");
  
  // Configure NTP with GMT+7 timezone for Thailand (ap-southeast-1)
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov", "time.google.com");
  
  Serial.print("Waiting for NTP time sync");
  time_t now = time(nullptr);
  int attempts = 0;
  
  // Wait for time to be synced (valid time > 1 Jan 2020)
  while (now < 1577836800 && attempts < 60) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }
  Serial.println();
  
  if (now < 1577836800) {
    Serial.println("ERROR: Failed to sync time with NTP - TLS will likely FAIL");
    Serial.println("This is the most common cause of SSL error -80 (0050)");
    Serial.println("Waiting 10 seconds before retrying...");
    delay(10000);
    sync_time(); // Retry
  } else {
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.print("✓ Time synced: ");
    Serial.println(asctime(&timeinfo));
  }
}

// ==================== Load Certificates ====================
void load_certificates() {
  Serial.println("\nUsing embedded TLS certificates (not SPIFFS)...");

  Serial.println("✓ Root CA: Embedded AmazonRootCA1");
  Serial.println("✓ Device Cert: Embedded AWS_DEVICE_CERT");
  Serial.println("✓ Private Key: Embedded AWS_DEVICE_KEY");

  #if defined(WIFI_CLIENT_SECURE_HAS_SETBUFFERSIZES)
    espClient.setBufferSizes(2048, 2048);
    Serial.println("✓ Buffer sizes set to 2048 bytes");
  #else
    Serial.println("NOTE: setBufferSizes not available on this core version");
  #endif

  // ✅ Use embedded certificates only (RootCA1 + device cert + private key)
  espClient.setCACert(AWS_ROOT_CA);
  espClient.setCertificate(AWS_DEVICE_CERT);
  espClient.setPrivateKey(AWS_DEVICE_KEY);
  Serial.println("✓ TLS credentials loaded - hostname verification ENABLED (ATS endpoint)");
}

// ==================== MQTT Setup ====================
void setup_mqtt() {
  client.setBufferSize(512);  // Increase buffer for larger JSON payloads
  client.setServer(aws_iot_endpoint, aws_iot_port);
  client.setCallback(callback);
  client.setKeepAlive(60);  // Send keep-alive every 60 seconds
  Serial.println("\nMQTT client configured");
  Serial.print("AWS IoT Endpoint: ");
  Serial.println(aws_iot_endpoint);
  Serial.print("Buffer size: 512 bytes, Keep-alive: 60s");
}

// ==================== Reconnect to MQTT ====================
void reconnect() {
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi();
    return;
  }
  
  if (!client.connected()) {
    Serial.print("Connecting to AWS IoT Core...");
    Serial.flush();
    
    // Additional debug: check time before connecting
    time_t now = time(nullptr);
    if (now < 1577836800) {
      Serial.println(" FAILED - Time not synced!");
      Serial.println("ERROR: System time is invalid. Certificate validation will fail.");
      Serial.println("Retrying time sync...");
      sync_time();
      delay(5000);
      return;
    }
    
    // Connect with persistent session (cleanSession = false)
    // This keeps the session and subscriptions across reconnects
    if (client.connect(thing_name, NULL, NULL, NULL, 0, false, NULL, false)) {
      Serial.println(" ✓ Connected with persistent session!");
      Serial.print("Client state: ");
      Serial.println(client.state());
      
      // Subscribe to single command topic (QoS 0 for immediate delivery)
      Serial.print("[DEBUG] Attempting to subscribe to: ");
      Serial.println(topic_command);
      bool subResult = client.subscribe(topic_command.c_str(), 0);
      Serial.print("[DEBUG] Subscribe result: ");
      Serial.println(subResult ? "TRUE" : "FALSE");
      Serial.print("[DEBUG] Client state after subscribe: ");
      Serial.println(client.state());
      
      if (subResult) {
        Serial.print("Subscribed to: ");
        Serial.println(topic_command);
        Serial.println("✓ Subscription confirmed - waiting for messages");
      } else {
        Serial.println("❌ Subscription failed!");
      }
      
      // DON'T publish immediately - wait for stable connection
      // publish_status();
      Serial.println("⏳ Listening for commands on MQTT...");
    } else {
      int state = client.state();
      Serial.print(" FAILED (rc=");
      Serial.print(state);
      Serial.println(")");
      
      // Print detailed error codes
      if (state == -4) Serial.println("  → Connection timeout");
      else if (state == -3) Serial.println("  → Connection lost");
      else if (state == -2) Serial.println("  → Connect failed");
      else if (state == -1) Serial.println("  → Disconnected");
      else if (state == 0) Serial.println("  → Connected");
      else if (state == 1) Serial.println("  → Bad protocol version");
      else if (state == 2) Serial.println("  → Bad client ID");
      else if (state == 3) Serial.println("  → Unavailable");
      else if (state == 4) Serial.println("  → Bad credentials");
      else if (state == 5) Serial.println("  → Unauthorized");
      
      Serial.println("Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ==================== MQTT Callback ====================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\n" );
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║       🔥 CALLBACK TRIGGERED! 🔥       ║");
  Serial.println("╚════════════════════════════════════════╝");
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  Serial.print("Payload length: ");
  Serial.println(length);
  Serial.print("Payload (raw): ");
  for (int i = 0; i < length; i++) {
    Serial.write(payload[i]);
  }
  Serial.println();
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.print("JSON parse error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* action = doc["action"] | "";   // e.g. "on", "off"
  int channel = doc["channel"] | 1;           // default channel 1
  int value = doc["value"] | -1;              // optional numeric

  Serial.print("Action: "); Serial.println(action);
  Serial.print("Channel: "); Serial.println(channel);
  Serial.print("Value  : "); Serial.println(value);

  // Map action to state
  int state = -1;
  if (strcmp(action, "on") == 0) state = 1;
  else if (strcmp(action, "off") == 0) state = 0;
  else if (strcmp(action, "toggle") == 0) {
    int pin = (channel == 1) ? RELAY_PIN_1 : RELAY_PIN_2;
    state = digitalRead(pin) ? 0 : 1;
  }

  if (state != -1) {
    control_relay(channel, state);
  } else {
    Serial.println("Unknown action, ignoring");
  }

  // Publish status immediately after control (no delay)
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
  StaticJsonDocument<256> doc;
  doc["thing_name"] = thing_name;
  doc["channel1"] = ch1_state;
  doc["channel2"] = ch2_state;
  doc["timestamp"] = millis();
  
  // Serialize and publish
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish(topic_state.c_str(), buffer, true); // retained latest state
  client.publish(topic_heartbeat.c_str(), "alive", true);
  
  Serial.print("State published: ");
  Serial.println(buffer);
}

// ==================== TLS Diagnostic ====================
void diagnose_tls_issue() {
  Serial.println("\n========== TLS DIAGNOSTICS ==========");
  
  // Check time
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.print("Current GMT Time: ");
  Serial.println(asctime(&timeinfo));
  
  if (now < 1577836800) {
    Serial.println("❌ CRITICAL: System time is INVALID (before 2020-01-01)");
    Serial.println("   This is why SSL is failing!");
    Serial.println("   → NTP sync failed");
    Serial.println("   → Re-run sync_time() from setup");
  } else {
    Serial.println("✓ System time is valid");
  }
  
  // Check WiFi
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("✓ WiFi connected: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("❌ WiFi NOT connected");
  }
  
  // ✅ All certificates are now embedded in code
  Serial.println("✓ Root CA: [Embedded - AmazonRootCA1]");
  Serial.println("✓ Device Cert: [Embedded - AWS_DEVICE_CERT]");
  Serial.println("✓ Private Key: [Embedded - AWS_DEVICE_KEY]");
  
  Serial.println("=====================================\n");
}
