# IoT Sensor Management System - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IoT SENSOR MANAGEMENT SYSTEM                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            HARDWARE LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  ESP32 #1   │  │  ESP32 #2   │  │  ESP32 #3   │  │  ESP32 #N   │        │
│  │  IoT Device │  │  IoT Device │  │  IoT Device │  │  IoT Device │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┼────────────────┼────────────────┘                │
│                          │                                                   │
│                   AWS IoT Core MQTT                                          │
│                   (Publish/Subscribe)                                        │
│                                                                              │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────────────┐
│                          AWS CLOUD LAYER                                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │   AWS IoT Core                      │  │   AWS API Gateway            │  │
│  │ - MQTT Broker                       │  │ - REST API Endpoints         │  │
│  │ - Device Shadow                     │  │ - WebSocket Support          │  │
│  │ - Certificate Management           │  │ - Authentication/Authorization
│  └────────────────┬────────────────────┘  └──────────────────────────────┘  │
│                   │                                                          │
│                   │ Message Stream                                           │
│                   ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │              AWS DynamoDB                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │   Sensors    │  │  Sensor Data │  │  Thresholds  │                │  │
│  │  │   Table      │  │  Table       │  │  Table       │                │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │  │
│  │  ┌──────────────┐  ┌──────────────┐                                   │  │
│  │  │   Users      │  │  Alerts      │                                   │  │
│  │  │   Table      │  │  Table       │                                   │  │
│  │  └──────────────┘  └──────────────┘                                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │              AWS Lambda Functions                                      │  │
│  │  - API Handlers        - Data Processing      - Notifications         │  │
│  │  - Authentication      - Alert Management     - Email Service         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │              AWS S3                                                    │  │
│  │  - Certificate Storage     - Backup/Logs      - Static Assets         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ REST API / WebSocket
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                       APPLICATION LAYER                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │           Next.js Frontend (React)                                  │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Pages/Components                                              │ │   │
│  │  │  - Dashboard        - Sensor Management   - Settings           │ │   │
│  │  │  - Device Registry  - Alert Configuration - User Profile       │ │   │
│  │  │  - Data Visualization - Real-time Monitoring                   │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Services/Contexts                                             │ │   │
│  │  │  - Auth Context      - WebSocket Connection   - API Client     │ │   │
│  │  │  - Theme Provider    - Notification Handler                    │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Libraries                                                     │ │   │
│  │  │  - Tailwind CSS    - Recharts     - React Query                │ │   │
│  │  │  - shadcn/ui       - Framer Motion                             │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │           Backend API Server (TypeScript/Node.js)                   │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Express Routes                                               │ │   │
│  │  │  - /api/sensors         - /api/devices      - /api/users      │ │   │
│  │  │  - /api/data            - /api/alerts       - /api/auth       │ │   │
│  │  │  - /api/thresholds      - /api/notifications                 │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Services/Business Logic                                       │ │   │
│  │  │  - Authentication       - Data Processing    - Alert Manager   │ │   │
│  │  │  - Device Management    - Threshold Mgmt     - Email Service   │ │   │
│  │  │  - Sensor Data Handler  - User Management                      │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Middleware                                                    │ │   │
│  │  │  - Authentication       - Error Handling     - Logging         │ │   │
│  │  │  - CORS                 - Validation         - Rate Limiting   │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Database/AWS Integration                                      │ │   │
│  │  │  - Prisma ORM           - AWS SDK            - DynamoDB Client │ │   │
│  │  │  - Connection Pooling   - S3 Integration                       │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────┐
│  ESP32 Sensors  │
│ (MQTT Publish)  │
└────────┬────────┘
         │
         │ Sensor Data
         │ (Temperature, Humidity, etc.)
         ▼
   ┌──────────────┐
   │ AWS IoT Core │
   │  (MQTT)      │
   └──────┬───────┘
          │
          │ Message Stream
          │
          ▼
   ┌─────────────────────┐
   │ Backend API Server  │
   │ (WebSocket/REST)    │
   └──────┬──────────────┘
          │
          ├──────────────────┬──────────────────┬─────────────────┐
          │                  │                  │                 │
          ▼                  ▼                  ▼                 ▼
   ┌─────────────┐   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   Store to  │   │  Check Alert │  │ Trigger Email│  │  Real-time   │
   │  DynamoDB   │   │  Thresholds  │  │ Notification │  │  Update (WS) │
   └─────────────┘   └──────────────┘  └──────────────┘  └──────────────┘
          │                                                        │
          │                                                        │
          └────────────────────────┬─────────────────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Frontend (React)│
                          │  Dashboard View  │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   User Interface │
                          │  - Charts/Graphs │
                          │  - Alerts Panel  │
                          │  - Controls      │
                          └──────────────────┘
```

## User Interaction Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─── (1) Login ──────────────┐
       │                            │
       │                            ▼
       │                    ┌──────────────┐
       │                    │  Backend API │
       │                    │ (Auth Check) │
       │                    └──────┬───────┘
       │                           │
       │    (2) JWT Token          │
       │◄──────────────────────────┘
       │
       ├─── (3) View Dashboard ────┐
       │                           │
       │    (4) WebSocket ───────┐ │
       │    Connection         │ │ │
       │◄──────────────────────┘ │ │
       │                         │ │
       │                         ▼ ▼
       │                 ┌──────────────┐
       │                 │  Backend API │
       │                 │  + DynamoDB  │
       │                 └──────────────┘
       │
       ├─── (5) Real-time Updates (WebSocket)
       │         - Live sensor data
       │         - Alert notifications
       │         - System status
       │
       └─── (6) User Actions ──────┐
               - Set Thresholds     │
               - Configure Devices  │
               - Update Profile     │
               - Send Notifications │
                                    │
                                    ▼
                            ┌──────────────┐
                            │  Backend API │
                            │  Update DB   │
                            │  Send Emails │
                            └──────────────┘
```

## Technology Stack

```
FRONTEND
├── Framework: Next.js (React)
├── Styling: Tailwind CSS + shadcn/ui
├── State Management: React Context + React Query
├── Real-time: WebSocket
├── Visualization: Recharts, Framer Motion
└── Language: TypeScript

BACKEND
├── Runtime: Node.js
├── Framework: Express.js
├── Language: TypeScript
├── Database: DynamoDB (Prisma ORM)
├── Authentication: JWT
├── Validation: Express Validator
└── AWS Services: IoT Core, Lambda, API Gateway

HARDWARE
├── Device: ESP32 Microcontroller
├── Communication: MQTT (AWS IoT Core)
├── Protocol: TLS/SSL
├── Sensors: Temperature, Humidity, Soil Moisture, etc.
└── Libraries: Arduino SDK

INFRASTRUCTURE
├── Cloud: AWS
├── Database: DynamoDB
├── Storage: S3
├── API: API Gateway
├── Compute: Lambda
├── IoT: AWS IoT Core
└── Deployment: Docker + Render/Amplify
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT LAYER                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Frontend Deployment (Render/Amplify/Vercel)               │ │
│  │  - Docker Container                                        │ │
│  │  - Next.js Build                                           │ │
│  │  - Nginx Reverse Proxy                                     │ │
│  │  - Environment Variables                                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Backend Deployment (Render/AWS Lambda)                    │ │
│  │  - Docker Container                                        │ │
│  │  - Node.js/TypeScript Runtime                              │ │
│  │  - Environment Variables                                   │ │
│  │  - AWS Credentials                                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AWS Cloud Services                                          │ │
│  │  - IoT Core Endpoint                                        │ │
│  │  - DynamoDB Tables                                          │ │
│  │  - S3 Buckets                                               │ │
│  │  - API Gateway Endpoints                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYER                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ESP32 ──── (TLS/SSL + Certificates) ──── AWS IoT Core          │
│               ▲                                                   │
│               │ Certificate Management                           │
│               └─── AWS Certificate Manager                       │
│                                                                   │
│  Frontend ──── (HTTPS + JWT) ──── Backend API                   │
│                   ▲                                               │
│                   │ Authentication                               │
│                   └─── JWT Tokens + OAuth                        │
│                                                                   │
│  Backend ──── (IAM Roles + Policies) ──── AWS Services          │
│                ▲                                                  │
│                │ Access Control                                  │
│                └─── AWS IAM (API Gateway, DynamoDB, S3)          │
│                                                                   │
│  Database ──── (Encryption at Rest + VPC) ──── DynamoDB         │
│                  ▲                                                │
│                  │ Data Protection                               │
│                  └─── KMS Encryption Keys                        │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
```
