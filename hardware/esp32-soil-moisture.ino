#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "GETZY";
const char* password = "Wipatsasicha7";

// Backend server - แก้เป็น IP Address ของคอมพิวเตอร์ที่รัน backend
// ค้นหาได้จาก: ipconfig (Windows) หรือ hostname -I (Linux/Mac)
const char* serverName = "http://192.168.1.166:3000/api/sensors/soil-moisture";

// GPIO pins
const int SOIL_MOISTURE_PIN = 34; // ADC pin for soil moisture sensor
const int LED_PIN = 2;  // Optional: LED indicator

// Configuration
const int READ_INTERVAL = 30000; // Read every 30 seconds
const int NUM_SAMPLES = 10; // Average readings
unsigned long lastReadTime = 0;

// Sensor calibration values (adjust based on your sensor)
const int DRY_VALUE = 4095;    // ADC value when completely dry
const int WET_VALUE = 1448;    // ADC value when completely wet

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("\n\nStarting Soil Moisture Sensor...");
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  connectToWiFi();
}

void loop() {
  // Check if it's time to read sensor
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    
    // Read sensor
    int moistureValue = readSoilMoisture();
    float moisturePercent = calculateMoisturePercentage(moistureValue);
    
    Serial.print("Soil Moisture - Raw: ");
    Serial.print(moistureValue);
    Serial.print(" | Percentage: ");
    Serial.print(moisturePercent);
    Serial.println("%");
    
    // Send to backend
    sendToBackend(moistureValue, moisturePercent);
    
    // Blink LED to indicate successful read
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
  }
  
  delay(100);
}

int readSoilMoisture() {
  int total = 0;
  
  // Take multiple samples and average
  for (int i = 0; i < NUM_SAMPLES; i++) {
    total += analogRead(SOIL_MOISTURE_PIN);
    delay(10);
  }
  
  return total / NUM_SAMPLES;
}

float calculateMoisturePercentage(int rawValue) {
  // Convert ADC value to percentage (0-100%)
  float percentage = map(rawValue, WET_VALUE, DRY_VALUE, 100, 0);
  
  // Constrain to 0-100%
  percentage = constrain(percentage, 0, 100);
  
  return percentage;
}

void sendToBackend(int rawValue, float moisturePercent) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    DynamicJsonDocument doc(200);
    doc["sensorId"] = "SOIL_MOISTURE_001";
    doc["type"] = "soil_moisture";
    doc["value"] = moisturePercent;
    doc["rawValue"] = rawValue;
    doc["unit"] = "%";
    doc["timestamp"] = String(millis());
    doc["location"] = "Garden";
    
    String payload;
    serializeJson(doc, payload);
    
    Serial.print("Sending to Backend: ");
    Serial.println(payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      
      String response = http.getString();
      Serial.print("Response: ");
      Serial.println(response);
      
      // Indicate success with LED
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
    } else {
      Serial.print("Error sending HTTP request. Code: ");
      Serial.println(httpResponseCode);
      
      // Indicate failure with LED blink
      for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
      }
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected!");
    connectToWiFi();
  }
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to WiFi");
  }
}
