/*
 * AWS IoT Core Certificate Configuration
 * 
 * ตัวอย่าง: นำ certificates มาจาก AWS IoT Core
 * 1. เข้า AWS IoT Core Console
 * 2. Thing -> Certificates -> Create Certificate
 * 3. Download CA, Certificate, Private Key
 * 4. Copy และแปลงเป็น String format แล้ววางที่นี่
 * 
 * วิธีแปลง PEM -> C String:
 * - เปิด certificate file ด้วย text editor
 * - คัดลอก content (รวมบรรทัด BEGIN/END)
 * - ใช้ Python: python3 -c "import sys; print('\\\"' + open('file.pem').read().replace('\\n', '\\\\n') + '\\\"')"
 */

#ifndef CERTS_H
#define CERTS_H

// AWS IoT Core CA Certificate (DigiCert Global Root CA)
static const char AWS_CERT_CA[] = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmsTQDA1AwDQYJKoZIhvcNAQEL
BQAwODELMAkGA1UEBhMCVVMxEDAOBgNVBAgTB0FyaXpvbmExEDAOBgNVBAcTB1Bi
b2VuaXgxDjAMBgNVBAoTBUFjbWUwHhcNMDMwNzA1MTcwMjI1WhcNMjIwNzA1MTcw
MjI1WjA4MQswCQYDVQQGEwJVUzEQMA4GA1UECBMHQXJpem9uYTEQMA4GA1UEBxMH
UGhvZW5peDEOMAwGA1UEChMFQWNtZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
AQoCggEBALCKyH2R6vMQ2RYF0r16TUGbHHLmYMBP3kL2a9Jd3hVs+bA8P5Wd3Jhq
Vbq14O4B3Y2c8FbfbKJl6KL6R8Vx6C7pqLWJqM9RlpLILw+5n3dCLQlLSz3N8b2u
YsVNKLqCZX7HtKx4+8RrJLEYJ9RjN5pJMvqNGzIj6nKBJVw8k5LngCJa5fL+/fTx
OGT2Tf7DxLkWb0hqBdnZVTf+2RMxL4b3JN2a7pKSjjkY7xVnDy4dJL3FnLxDqjNW
O+ZBqXJQoNGJXBCnMU2c19f6ZQSB4cLUSFXFBr3n3c0hEU9a5MfD7LeXcvKJXM7d
BUYvHr3LQyEw3NP+j1W5j2GcYM8BRFhHjIUCAwEAAaMTMBEwDwYDVR0TAQH/BAUw
AwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAc4oCgZazvL8D2kWxzQBWPDMfJ6A9D0yz
GVQcZTm/zzjnpJrXWlqJTQVLJtLOBLPyiJHMgQJ+2fQ/F8l5AiXb4J96l8OjW6d1
LoKDXfUmQhsCT1eZ/8hMqGOLPRv+NG/Dv6EVwR5t/pVjPGNiLYZl6x7M5zHCzk3M
RG4y2LEQDqbXhS5YnAi6GVMCc1v5I3i8pXVe5R6LjZCNGrVjKOz6OHHMdZzJ5gzi
L2A5cHLDVmVmFrfNT+LSLjbqqFZCPJ5H/RlrJLcB8eFzcW3cYALGHAGWbW6l39FL
rKe+qblE6lFsGUG4VEi2pOtPALWnPCrF0T6B9nk1jLdZ8L5D4I/eFg==
-----END CERTIFICATE-----
)EOF";

// ========== IMPORTANT: ดาวน์โหลด certificates จาก AWS IoT Core ==========
// 1. ไปที่ AWS IoT Core Console
// 2. Thing -> ชื่อ Thing (ESP32_RELAY_MOISTURE) -> Certificates
// 3. สร้าง Certificate ใหม่ (Create Certificate)
// 4. Download:
//    - Certificate (.pem.crt) -> AWS_CERT_CRT
//    - Private Key (.pem.key) -> AWS_CERT_PRIVATE
// 5. CA Certificate ดาวน์โหลดจากลิงค์ที่เก็บไว้ -> AWS_CERT_CA
// ==============================================================

// Device Certificate (ดาวน์โหลดจาก AWS IoT Core)
static const char AWS_CERT_CRT[] = R"EOF(
-----BEGIN CERTIFICATE-----
[YOUR_DEVICE_CERTIFICATE_HERE]
-----END CERTIFICATE-----
)EOF";

// Device Private Key (ดาวน์โหลดจาก AWS IoT Core)
static const char AWS_CERT_PRIVATE[] = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
[YOUR_PRIVATE_KEY_HERE]
-----END RSA PRIVATE KEY-----
)EOF";

#endif // CERTS_H
