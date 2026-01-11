import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import sensorService from './services/sensor.service.js';
import deviceService from './services/device.service.js';
import { PutCommand, QueryCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './aws/dynamodb.js';
import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, authenticate, AuthRequest, verifyRefreshToken, ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './middleware/auth.js';
import { sendWelcomeEmail, logNotification, sendPasswordResetEmail } from './services/email.service.js';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { publishToTopic, updateThingShadow } from './services/iot.service.js';
import { DeviceAccessService, DeviceRole } from './services/device-access.service.js';
import mqtt from 'mqtt';

dotenv.config();

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type Definitions
interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  lastUpdate: string;
  value?: number;
  unit?: string;
}

interface Sensor {
  sensorId: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  location: string;
}

interface Database {
  devices: Device[];
  sensors: Sensor[];
  notifications: any[];
}

interface APIResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  count?: number;
}

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://project004-frontend.onrender.com')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';
const accessTokenCookie = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  maxAge: ACCESS_TOKEN_TTL_MS,
  path: '/',
};

const refreshTokenCookie = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: '/',
};

const loginAttempts: Record<string, { count: number; firstAttempt: number }> = {};

// ==================== AWS IoT Data Plane Setup for MQTT Publishing ====================
let iotClient: IoTDataPlaneClient | null = null;

// ==================== MQTT Client Setup for Direct Device Publishing ====================
let mqttClient: mqtt.MqttClient | null = null;
const fs = await import('fs');
const path_module = await import('path');

async function publishCommandToDevices(topic: string, message: Record<string, any>) {
  const payload = JSON.stringify(message);
  let delivered = false;

  if (mqttClient && mqttClient.connected) {
    await new Promise<void>((resolve, reject) => {
      mqttClient!.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) return reject(error);
        return resolve();
      });
    });
    delivered = true;
  }

  if (iotClient) {
    await iotClient.send(new PublishCommand({
      topic,
      payload: new TextEncoder().encode(payload),
      qos: 1,
    }));
    delivered = true;
  }

  return delivered;
}

async function initializeMqttClient() {
  try {
    const endpoint = process.env.AWS_IOT_ENDPOINT;
    const certPath = process.env.AWS_IOT_CERT_PATH;
    const keyPath = process.env.AWS_IOT_KEY_PATH;
    const caPath = process.env.AWS_IOT_CA_PATH;

    if (!endpoint || !certPath || !keyPath || !caPath) {
      console.warn('[MQTT] Missing AWS IoT certificate paths - MQTT publishing disabled');
      return;
    }

    // Read certificates
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    const ca = fs.readFileSync(caPath, 'utf8');

    // Connect to AWS IoT Core via MQTT
    mqttClient = mqtt.connect(`mqtts://${endpoint}:8883`, {
      cert: cert,
      key: key,
      ca: ca,
      clientId: `backend-server-${Date.now()}`,
      clean: false,
      keepalive: 60,
      reconnectPeriod: 2000,
    });

    mqttClient.on('connect', () => {
      console.log('[MQTT] ✅ Connected to AWS IoT Core');
    });

    mqttClient.on('reconnect', () => {
      console.log('[MQTT] Reconnecting to AWS IoT Core...');
    });

    mqttClient.on('offline', () => {
      console.warn('[MQTT] Offline - will retry');
    });

    mqttClient.on('error', (error) => {
      console.error('[MQTT] Connection error:', error);
    });

    mqttClient.on('disconnect', () => {
      console.log('[MQTT] Disconnected from AWS IoT Core');
    });

    console.log('[MQTT] Client initialized for AWS IoT Core MQTT');
  } catch (error) {
    console.error('[MQTT] Initialization error:', error);
  }
}

async function initializeIoTClient() {
  try {
    const endpoint = process.env.AWS_IOT_ENDPOINT;
    const region = process.env.AWS_IOT_REGION;

    if (!endpoint || !region) {
      console.warn('[IoT] Missing AWS IoT environment variables - IoT publishing disabled');
      return;
    }

    iotClient = new IoTDataPlaneClient({ 
      region: region,
      endpoint: `https://${endpoint}`,
    });

    console.log('[IoT] Client initialized for AWS IoT Data Plane');
  } catch (error) {
    console.error('[IoT] Initialization error:', error);
  }
}

// Initialize clients when server starts
initializeIoTClient().catch((error) => {
  console.error('[IoT] Client initialization error:', error);
});

initializeMqttClient().catch((error) => {
  console.error('[MQTT] Client initialization error:', error);
});

// Middleware
// Explicit CORS headers (cover errors and non-Express paths too)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
  }
  next();
});

// Fallback CORS (reflect origin)
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// ==================== In-Memory Database ====================
const db: Database = {
  devices: [
    {
      deviceId: "LIGHT_001",
      name: "หลอดไฟห้องนั่งเล่น",
      type: "light",
      status: "off",
      lastUpdate: new Date().toISOString(),
      location: "Living Room",
      value: 0,
    },
    {
      deviceId: "LIGHT_002",
      name: "หลอดไฟห้องนอน",
      type: "light",
      status: "off",
      lastUpdate: new Date().toISOString(),
      location: "Bedroom",
      value: 0,
    },
    {
      deviceId: "ESP32_001",
      name: "เซ็นเซอร์อุณหภูมิ",
      type: "sensor",
      status: "on",
      lastUpdate: new Date().toISOString(),
      location: "Living Room",
      value: 25.5,
      unit: "°C",
    },
    {
      deviceId: "ESP32_002",
      name: "เซ็นเซอร์ความชื้น",
      type: "sensor",
      status: "on",
      lastUpdate: new Date().toISOString(),
      location: "Bedroom",
      value: 65,
      unit: "%",
    },
  ],
  sensors: [
    {
      id: "SENSOR_001",
      sensorId: "SENSOR_001",
      name: "เซ็นเซอร์อุณหภูมิและความชื้นอากาศ",
      type: "temperature_humidity",
      temperature: 28.5,
      humidity: 65,
      unit: "°C, %",
      timestamp: new Date().toISOString(),
      isActive: true,
      location: "ห้องนั่งเล่น",
    },
    {
      id: "SENSOR_002",
      sensorId: "SENSOR_002",
      name: "เซ็นเซอร์วัดความเข้มแสง",
      type: "light",
      illuminance: 450,
      unit: "lux",
      timestamp: new Date().toISOString(),
      isActive: true,
      location: "ห้องนั่งเล่น",
    },
    {
      id: "SENSOR_003",
      sensorId: "SENSOR_003",
      name: "เซ็นเซอร์วัดความชื้นในดิน",
      type: "soil_moisture",
      moisture: 55,
      unit: "%",
      timestamp: new Date().toISOString(),
      isActive: true,
      location: "สวน",
    },
  ],
  notifications: [],
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, accessTokenCookie);
  res.cookie('refreshToken', refreshToken, refreshTokenCookie);
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

function incrementLoginAttempt(key: string) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 5;
  const entry = loginAttempts[key];

  if (!entry || now - entry.firstAttempt > windowMs) {
    loginAttempts[key] = { count: 1, firstAttempt: now };
    return { blocked: false };
  }

  loginAttempts[key].count += 1;
  if (loginAttempts[key].count > maxAttempts) {
    return { blocked: true };
  }

  return { blocked: false };
}

// ==================== API Routes ====================

// Health Check
app.get('/health', (req: Request, res: Response) => {
  console.log('[Health Check] Request received');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasAwsRegion: !!process.env.AWS_REGION,
    }
  });
});

// Auto-register endpoint for devices (ESP32, etc)
app.post('/api/devices/auto-register', async (req: Request, res: Response) => {
  try {
    const { name, deviceType, ipAddress, macAddress, firmwareVersion } = req.body;
    const clientIp = req.ip || ipAddress;

    console.log(`[Auto-Register] Device connecting: ${name} (${deviceType}) from ${clientIp}`);

    // Generate device ID
    const deviceId = `${deviceType.toUpperCase()}_${(macAddress || clientIp).slice(-6).toUpperCase()}`;
    const now = new Date().toISOString();

    const device = {
      deviceId,
      name: name || `Device ${deviceId}`,
      type: deviceType || 'sensor',
      status: 'online',
      location: 'auto-discovered',
      macAddress: macAddress || 'UNKNOWN',
      ipAddress: clientIp,
      lastUpdate: now,
      registeredAt: now,
      discoveredAt: now,
      firmwareVersion: firmwareVersion || '1.0.0',
    };

    // Save to DynamoDB
    try {
      await dynamoDb.send(
        new PutCommand({
          TableName: process.env.DYNAMODB_DEVICE_STATUS_TABLE || 'DeviceStatus',
          Item: device
        })
      );
      console.log(`[Auto-Register] ✅ Device registered: ${deviceId}`);
    } catch (dbError: any) {
      console.warn(`[Auto-Register] DynamoDB save warning: ${dbError.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Device auto-registered successfully',
      data: {
        deviceId,
        name: device.name,
        type: deviceType,
        status: 'online',
        registeredAt: now,
      }
    });
  } catch (error: any) {
    console.error('[Auto-Register Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RELAY API (for ESP32 HTTP Polling) ====================
// State storage for 2-channel relay
interface RelayState {
  relay1: 'on' | 'off';
  relay2: 'on' | 'off';
  lastUpdate: string;
}

let relayState: RelayState = {
  relay1: 'off',
  relay2: 'off',
  lastUpdate: new Date().toISOString(),
};

// SSE subscribers for live relay updates
const relaySubscribers = new Set<Response>();

function broadcastRelayState() {
  const payload = `data: ${JSON.stringify(relayState)}\n\n`;
  for (const res of relaySubscribers) {
    try {
      if ((res as any).writableEnded) {
        relaySubscribers.delete(res);
        continue;
      }
      res.write(payload);
    } catch (err) {
      relaySubscribers.delete(res);
    }
  }
}

// GET relay state (for ESP32 to poll)
app.get('/api/relay/state', (req: Request, res: Response) => {
  res.json(relayState);
});

// SSE stream for realtime relay updates
app.get('/api/relay/stream', (req: Request, res: Response) => {
  // Required SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Hint some proxies (like nginx) not to buffer
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Recommended: set client retry in case of disconnects
  res.write(`retry: 3000\n`);

  // Send initial state immediately
  res.write(`event: init\n`);
  res.write(`data: ${JSON.stringify(relayState)}\n\n`);

  relaySubscribers.add(res);

  // Heartbeat to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      if ((res as any).writableEnded) throw new Error('stream ended');
      res.write(`event: keepalive\n`);
      res.write(`data: ping\n\n`);
    } catch {
      clearInterval(heartbeat);
      relaySubscribers.delete(res);
      try { res.end(); } catch {}
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    relaySubscribers.delete(res);
    try { res.end(); } catch {}
  });
});
// GET relay history from DynamoDB
app.get('/api/relay/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await dynamoDb.send(new QueryCommand({
      TableName: process.env.DYNAMODB_DEVICE_STATUS_TABLE || 'DeviceStatus',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': 'relay-module-01',
      },
      ScanIndexForward: false, // เรียงจากใหม่ไปเก่า
      Limit: limit,
    }));
    res.json({ success: true, data: result.Items || [] });
  } catch (error: any) {
    console.error('[Relay History]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Test MQTT Publish (Debug Route) ====================
app.post('/api/test/mqtt-publish', async (req: Request, res: Response) => {
  try {
    const { topic, message } = req.body;

    if (!topic || !message) {
      return res.status(400).json({ error: 'Missing topic or message' });
    }

    console.log(`[Test] Publishing to topic: ${topic}`);
    console.log(`[Test] Message: ${JSON.stringify(message)}`);
    const delivered = await publishCommandToDevices(topic, message);
    if (!delivered) {
      return res.status(500).json({ error: 'No MQTT or IoT client available to publish' });
    }

    console.log(`[Test] ✅ Published via ${mqttClient?.connected ? 'mqtt (and IoT fallback)' : 'IoT Data Plane'}`);
    return res.json({ success: true, message: 'Published to device(s)' });
  } catch (error: any) {
    console.error('[Test] Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT relay state (for web UI to control)
app.put('/api/relay/state', async (req: Request, res: Response) => {
  try {
    const { relay1, relay2 } = req.body;
    
    if (relay1 !== undefined) {
      relayState.relay1 = relay1 === 'on' || relay1 === true ? 'on' : 'off';
    }
    if (relay2 !== undefined) {
      relayState.relay2 = relay2 === 'on' || relay2 === true ? 'on' : 'off';
    }
    
    relayState.lastUpdate = new Date().toISOString();
    console.log('[Relay Control]', relayState);
    
    const thingName = process.env.AWS_IOT_THING_NAME || 'esp32-relay-01';
    const commandTopic = `${thingName}/command`;

    try {
      if (relay1 !== undefined) {
        const action = relayState.relay1 === 'on' ? 'on' : 'off';
        await publishCommandToDevices(commandTopic, { action, channel: 1 });
        console.log(`[Published] ${commandTopic}: ${action} ch1`);
      }
      if (relay2 !== undefined) {
        const action = relayState.relay2 === 'on' ? 'on' : 'off';
        await publishCommandToDevices(commandTopic, { action, channel: 2 });
        console.log(`[Published] ${commandTopic}: ${action} ch2`);
      }
    } catch (publishError: any) {
      console.error('[Publish Error]', publishError);
    }
    
    // บันทึกลง DynamoDB
    try {
      await dynamoDb.send(new PutCommand({
        TableName: process.env.DYNAMODB_DEVICE_STATUS_TABLE || 'DeviceStatus',
        Item: {
          deviceId: 'relay-module-01',
          deviceName: 'ESP32 2-Channel Relay',
          type: 'relay',
          status: relayState.relay1 === 'on' || relayState.relay2 === 'on' ? 'active' : 'idle',
          relay1: relayState.relay1,
          relay2: relayState.relay2,
          lastUpdate: relayState.lastUpdate,
          time: new Date().toISOString(),
        },
      }));
      console.log('[DynamoDB] Relay state saved');
    } catch (dbError: any) {
      console.error('[DynamoDB Error]', dbError.message);
      // ไม่ throw error เพื่อให้ระบบทำงานต่อได้แม้ DynamoDB fail
    }
    
    // Notify SSE subscribers about the new state
    broadcastRelayState();
    
    res.json({ success: true, state: relayState });
  } catch (error) {
    console.error('[Relay API Error]', error);
    res.status(500).json({ success: false, error: 'Failed to update relay' });
  }
});

// ==================== USERS API (DynamoDB) ====================
// POST: create user from email
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const userId = randomUUID();
    const now = new Date().toISOString();

    await dynamoDb.send(new PutCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Item: {
        userId,
        email: normalizedEmail,
        name: name || null,
        createdAt: now,
        updatedAt: now,
      },
      ConditionExpression: 'attribute_not_exists(email)', // prevent duplicate email
    }));

    res.status(201).json({
      success: true,
      user: { userId, email: normalizedEmail, name: name || null, createdAt: now },
    });
  } catch (error: any) {
    const isDuplicate = error?.name === 'ConditionalCheckFailedException';
    if (isDuplicate) {
      return res.status(409).json({ success: false, error: 'email already exists' });
    }
    console.error('[Users API Error] create:', error);
    res.status(500).json({ success: false, error: 'Failed to create user', message: error?.message });
  }
});

// GET: find user by email or list (limit 50)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string | undefined)?.trim().toLowerCase();
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    if (email) {
      const result = await dynamoDb.send(new QueryCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
        Limit: limit,
      }));
      return res.json({ success: true, count: result.Items?.length || 0, users: result.Items || [] });
    }

    // fallback: scan limited items
    const scan = await dynamoDb.send(new ScanCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Limit: limit,
    }));
    res.json({ success: true, count: scan.Items?.length || 0, users: scan.Items || [] });
  } catch (error: any) {
    console.error('[Users API Error] list:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users', message: error?.message });
  }
});

// ==================== SENSORS API ====================
let sensorFetchWarningShown = false;
async function fetchLatestSensorFromAws(sensorId: string) {
  const tableName = process.env.DYNAMODB_SENSOR_DATA_TABLE || 'SensorData';

  // หากยังไม่ได้ตั้งค่าการเชื่อมต่อ AWS ให้คืน null เพื่อใช้ข้อมูลในหน่วยความจำ
  if (!process.env.AWS_REGION && !process.env.AWS_IOT_REGION) {
    return null;
  }

  try {
    // รองรับชื่อคีย์ที่สะกดคลาดเคลื่อน (sensorld) และ sensorId
    const keyName = 'sensorId';
    const altKey = 'sensorld';

    const result = await dynamoDb.send(new QueryCommand({
      TableName: tableName,
      // ถ้า key หลักไม่ตรง ให้ลอง query ด้วย altKey ผ่าน expression attribute name
      KeyConditionExpression: `#pk = :sensorId`,
      ExpressionAttributeNames: {
        '#pk': keyName,
      },
      ExpressionAttributeValues: { ':sensorId': sensorId },
      ScanIndexForward: false, // ดึงตัวล่าสุด
      Limit: 1,
    }));

    let item = result.Items?.[0];

    // ถ้าไม่ได้ผลลัพธ์ ให้ลอง query ด้วยชื่อคีย์สำรอง (sensorld)
    if (!item) {
      const altResult = await dynamoDb.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: `#pk = :sensorId`,
        ExpressionAttributeNames: {
          '#pk': altKey,
        },
        ExpressionAttributeValues: { ':sensorId': sensorId },
        ScanIndexForward: false,
        Limit: 1,
      }));
      item = altResult.Items?.[0];
    }

    if (!item) return null;

    const toNumber = (val: any): number | undefined => {
      if (val === undefined || val === null) return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    return {
      sensorId: (item as any).sensorId || (item as any).sensorld || sensorId,
      name:
        (item as any).name ||
        (item as any).sensorName ||
        (item as any).deviceName ||
        sensorId,
      type:
        (item as any).type ||
        (item as any).sensorType ||
        (item as any).readingType ||
        'unknown',
      value: toNumber((item as any).value),
      unit: (item as any).unit,
      temperature: toNumber((item as any).temperature),
      humidity: toNumber((item as any).humidity),
      illuminance: toNumber((item as any).light) || toNumber((item as any).illuminance),
      moisture: toNumber((item as any).soilMoisture) || toNumber((item as any).moisture),
      timestamp: (item as any).timestamp || (item as any).time,
      location: (item as any).location,
    } satisfies Partial<Sensor>;
  } catch (error: any) {
    const isValidation = typeof error?.name === 'string' && error.name.includes('ValidationException');
    if (isValidation || String(error?.__type || '').includes('ValidationException')) {
      if (!sensorFetchWarningShown) {
        console.warn('[Sensors API] DynamoDB schema does not match sensorId key; skip AWS sensor fetch. Using in-memory data instead.');
        sensorFetchWarningShown = true;
      }
      return null;
    }

    console.error('[Sensors API] AWS fetch error:', error);
    return null;
  }
}

// ดึงข้อมูลเซ็นเซอร์ทั้งหมด: ใช้ข้อมูลจริงจาก AWS ถ้ามี ไม่เช่นนั้น fallback เป็น in-memory
app.get('/api/sensors', async (req: Request, res: Response) => {
  try {
    const sensors = await Promise.all(
      db.sensors.map(async (sensor) => {
        const real = await fetchLatestSensorFromAws(sensor.sensorId);
        if (real) {
          // ผสมรวมข้อมูล config กับข้อมูล real-time จาก AWS
          const merged = { ...sensor, ...real };
          
          // ตรวจสอบว่าเป็นเซนเซอร์ประเภทไหน และใส่ข้อมูลที่เหมาะสม
          if (sensor.type === 'temperature_humidity') {
            return {
              ...merged,
              temperature: real.temperature || merged.temperature || 28.5,
              humidity: real.humidity || merged.humidity || 65,
            };
          } else if (sensor.type === 'light') {
            return {
              ...merged,
              illuminance: real.illuminance || merged.illuminance || 450,
            };
          } else if (sensor.type === 'soil_moisture') {
            return {
              ...merged,
              moisture: real.moisture || merged.moisture || 55,
            };
          }
          
          return merged;
        }
        return sensor;
      })
    );
    res.json(sensors);
  } catch (error) {
    console.error('[Sensors API] list error:', error);
    res.json(db.sensors);
  }
});

// Temperature graph mock data for dashboard graph
app.get('/api/graph/temperature', (req: Request, res: Response) => {
  const now = Date.now();
  const points = Array.from({ length: 12 }).map((_, idx) => ({
    timestamp: new Date(now - idx * 5 * 60 * 1000).toISOString(),
    temperature: 25 + Math.sin(idx / 2) * 2 + Math.random(),
  })).reverse();

  res.json({
    success: true,
    data: points,
    threshold: { min: 24, max: 30 },
  });
});

// ดึงข้อมูลเซ็นเซอร์รายตัว: พยายามดึงจาก AWS ก่อน แล้วค่อย fallback
app.get('/api/sensors/:sensorId', async (req: Request, res: Response) => {
  try {
    const sensorId = req.params.sensorId;
    const fromAws = await fetchLatestSensorFromAws(sensorId);
    if (fromAws) return res.json(fromAws);

    const sensor = db.sensors.find((s) => s.sensorId === sensorId);
    if (!sensor) {
      return res.status(404).json({ error: 'ไม่พบเซ็นเซอร์' });
    }
    return res.json(sensor);
  } catch (error) {
    console.error('[Sensors API] get error:', error);
    const fallback = db.sensors.find((s) => s.sensorId === req.params.sensorId);
    if (fallback) return res.json(fallback);
    return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซ็นเซอร์ได้' });
  }
});

// ฟังก์ชันดึงอีเมลของเจ้าของ device
async function getDeviceOwnerEmail(deviceId: string): Promise<string | null> {
  try {
    // ค้นหา owner จาก DeviceAccess table
    const params = {
      TableName: process.env.DYNAMODB_DEVICE_ACCESS_TABLE || 'DeviceAccess',
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      FilterExpression: '#role = :ownerRole',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
        ':ownerRole': 'owner'
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    
    if (result.Items && result.Items.length > 0) {
      const ownerId = result.Items[0].userId;
      
      // ดึงข้อมูลผู้ใช้จาก Users table
      const userParams = {
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        Key: {
          userId: ownerId
        }
      };
      
      const userResult = await dynamoDb.send(new GetCommand(userParams));
      
      if (userResult.Item && userResult.Item.email) {
        return userResult.Item.email;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Get Device Owner Email Error]:', error);
    return null;
  }
}

// ฟังก์ชันตรวจสอบค่าต่อ threshold
async function checkThresholdAndCreateAlert(
  deviceId: string,
  sensorType: string,
  value: number,
  userEmail?: string
) {
  try {
    // ดึง thresholds สำหรับ device นี้
    let thresholds = await thresholdService.getThresholdsByDevice(deviceId);
    // หากยังไม่มี threshold สำหรับอุปกรณ์นี้ ให้สร้างค่าเริ่มต้นอัตโนมัติ
    if (!thresholds || thresholds.length === 0) {
      await thresholdService.ensureDefaultThresholds(deviceId);
      thresholds = await thresholdService.getThresholdsByDevice(deviceId);
    }
    
    // หา threshold สำหรับ sensor type นี้
    const relevantThreshold = thresholds.find(t => t.sensorType === sensorType);
    
    if (!relevantThreshold || !relevantThreshold.enabled) {
      return { alertCreated: false, reason: 'No active threshold' };
    }

    let alertCreated = false;
    let alertMessage = '';
    let alertLevel: 'critical' | 'warning' | 'info' = 'info';

    // ตรวจสอบค่าต่ำสุด
    if (relevantThreshold.minValue !== undefined && value < relevantThreshold.minValue) {
      alertCreated = true;
      alertMessage = `⚠️ ${sensorType} ต่ำสุด: ค่า ${value} ต่ำกว่า ${relevantThreshold.minValue}`;
      alertLevel = 'warning';
    }

    // ตรวจสอบค่าสูงสุด
    if (relevantThreshold.maxValue !== undefined && value > relevantThreshold.maxValue) {
      alertCreated = true;
      alertMessage = `🚨 ${sensorType} เกินขีดจำกัด: ค่า ${value} เกินกว่า ${relevantThreshold.maxValue}`;
      alertLevel = 'critical';
    }

    if (alertCreated) {
      // สร้าง notification
      const notification = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        deviceId,
        sensorType,
        message: alertMessage,
        level: alertLevel,
        value,
        threshold: relevantThreshold,
        time: new Date().toISOString(),
        isRead: false,
      };

      db.notifications.push(notification);
      console.log(`[Alert Created] ${alertMessage}`);

      // บันทึก notification ลงใน database (ถ้ามี)
      try {
        logNotification(
          dynamoDb,
          deviceId,
          deviceId,
          'alert',
          'sent',
          alertMessage
        );
      } catch (logError) {
        console.warn('[Notification Log] Failed to log:', logError);
      }

      // ส่งอีเมลแจ้งเตือนถ้าเปิดใช้งาน
      if (relevantThreshold.notifyEmail) {
        // ถ้าไม่มี userEmail ให้ดึงจาก device owner
        let recipientEmail: string | undefined = userEmail || undefined;
        
        if (!recipientEmail) {
          recipientEmail = (await getDeviceOwnerEmail(deviceId)) || undefined;
        }
        
        // ถ้ายังไม่มี ใช้ ADMIN_EMAIL เป็น fallback
        if (!recipientEmail) {
          recipientEmail = process.env.ADMIN_EMAIL || undefined;
        }
        
        if (recipientEmail) {
          try {
            await sendAlertEmail(
              recipientEmail,
              `🚨 แจ้งเตือน: ${sensorType} เกินขีดจำกัด`,
              `
                <div style="font-family: Arial, sans-serif;">
                  <h2 style="color: #d32f2f;">⚠️ แจ้งเตือนค่าเซ็นเซอร์เกินขีดจำกัด</h2>
                  <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
                    <p><strong>อุปกรณ์:</strong> ${deviceId}</p>
                    <p><strong>ประเภทเซ็นเซอร์:</strong> ${sensorType}</p>
                    <p><strong>ค่าปัจจุบัน:</strong> ${value}</p>
                    <p><strong>ขีดจำกัดต่ำสุด:</strong> ${relevantThreshold.minValue || '-'}</p>
                    <p><strong>ขีดจำกัดสูงสุด:</strong> ${relevantThreshold.maxValue || '-'}</p>
                    <p><strong>ระดับ:</strong> <span style="color: ${alertLevel === 'critical' ? '#d32f2f' : '#ff9800'};">${alertLevel.toUpperCase()}</span></p>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    ${alertMessage}
                  </p>
                  <p style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/alerts" 
                       style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      ดูรายละเอียด
                    </a>
                  </p>
                </div>
              `
            );
            console.log(`📧 Alert email sent to ${recipientEmail} (device owner)`);
          } catch (emailError) {
            console.error('[Email Alert Error]:', emailError);
          }
        } else {
          console.warn('[Email Alert] No recipient email found (no owner, no ADMIN_EMAIL)');
        }
      }

      return { alertCreated: true, notification };
    }

    return { alertCreated: false, reason: 'Value within threshold' };
  } catch (error) {
    console.error('[Threshold Check Error]:', error);
    return { alertCreated: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

app.post('/api/sensors', async (req: Request, res: Response) => {
  try {
    const { sensorId, deviceId, sensorType, value, userEmail } = req.body;

    const sensorIndex = db.sensors.findIndex((s) => s.sensorId === sensorId);
    if (sensorIndex !== -1) {
      db.sensors[sensorIndex].value = value;
      db.sensors[sensorIndex].timestamp = new Date().toISOString();

      console.log(`[Sensor Update] ${sensorId}: ${value}`);

      // ตรวจสอบ threshold ถ้ามี deviceId และ sensorType
      let thresholdCheckResult = { alertCreated: false };
      if (deviceId && sensorType && typeof value === 'number') {
        // ส่ง userEmail ไปด้วย (ถ้ามี)
        thresholdCheckResult = await checkThresholdAndCreateAlert(deviceId, sensorType, value, userEmail);
      }

      res.json({ 
        success: true, 
        sensor: db.sensors[sensorIndex],
        thresholdCheck: thresholdCheckResult
      });
    } else {
      res.status(404).json({ error: "ไม่พบเซ็นเซอร์" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "อัปเดตเซ็นเซอร์ไม่สำเร็จ" });
  }
});

// ==================== IoT PUBLISH API ====================
app.post('/api/iot/publish', async (req: Request, res: Response) => {
  try {
    const { topic, payload } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: 'topic is required' });
    }

    await publishToTopic(topic, payload ?? {});

    res.json({
      success: true,
      message: 'Command sent to device',
      topic,
      payload,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] IoT publish failed', error);
    res.status(500).json({ success: false, error: 'Failed to publish command' });
  }
});

// ==================== IoT SHADOW UPDATE API ====================
app.post('/api/iot/shadow', async (req: Request, res: Response) => {
  try {
    const { thingName, desired } = req.body;
    if (!thingName) {
      return res.status(400).json({ success: false, error: 'thingName is required' });
    }

    const response = await updateThingShadow(thingName, desired ?? {});

    res.json({ success: true, message: 'Shadow updated', thingName, desired, response });
  } catch (error) {
    console.error('[API] IoT shadow update failed', error);
    res.status(500).json({ success: false, error: 'Failed to update shadow' });
  }
});

// ==================== MULTI-USER DEVICE MANAGEMENT API ====================
// Get all devices accessible by current user
app.get('/api/user/devices', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const devices = await DeviceAccessService.getUserDevices(userId);
    
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  } catch (error) {
    console.error('[Get User Devices Error]:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Control a device (send command via IoT Core)
app.post('/api/devices/:deviceId/control', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { deviceId } = req.params;
    const { action, value } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has control permission
    const hasPermission = await DeviceAccessService.hasPermission(userId, deviceId, 'control');
    if (!hasPermission) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ควบคุมอุปกรณ์นี้' });
    }

    // Publish command to IoT Core
    const topic = `${deviceId}/command`;
    const message = { action, value, timestamp: new Date().toISOString() };
    
    const success = await publishToTopic(topic, message);

    if (success) {
      console.log(`[Device Control] User ${userId} sent ${action} to ${deviceId}`);
      
      res.json({
        success: true,
        message: `Command sent to ${deviceId}`,
        data: { deviceId, action, value }
      });
    } else {
      res.status(500).json({ error: 'Failed to send command to device' });
    }
  } catch (error) {
    console.error('[Device Control Error]:', error);
    res.status(500).json({ error: 'Failed to control device' });
  }
});

// Share device with another user
app.post('/api/devices/:deviceId/share', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { deviceId } = req.params;
    const { targetUserId, role } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!targetUserId || !role) {
      return res.status(400).json({ error: 'Missing targetUserId or role' });
    }

    // Check if user has share permission
    const hasPermission = await DeviceAccessService.hasPermission(userId, deviceId, 'share');
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to share this device' });
    }

    const access = await DeviceAccessService.shareDevice(userId, deviceId, targetUserId, role as DeviceRole);

    res.json({
      success: true,
      message: `Device ${deviceId} shared with user ${targetUserId}`,
      data: access
    });
  } catch (error: any) {
    console.error('[Share Device Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to share device' });
  }
});

// Get all users who have access to a device
app.get('/api/devices/:deviceId/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { deviceId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasAccess = await DeviceAccessService.hasAccess(userId, deviceId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this device' });
    }

    const users = await DeviceAccessService.getDeviceUsers(deviceId);

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('[Get Device Users Error]:', error);
    res.status(500).json({ error: 'Failed to fetch device users' });
  }
});

// Revoke user access to a device
app.delete('/api/devices/:deviceId/users/:targetUserId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { deviceId, targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasPermission = await DeviceAccessService.hasPermission(userId, deviceId, 'share');
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to revoke access' });
    }

    await DeviceAccessService.revokeAccess(targetUserId, deviceId);

    res.json({
      success: true,
      message: `Access revoked for user ${targetUserId}`
    });
  } catch (error: any) {
    console.error('[Revoke Access Error]:', error);
    res.status(500).json({ error: error?.message || 'Failed to revoke access' });
  }
});

// ==================== WEATHER API ====================
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string) || 'Bangkok';

    const weatherData = {
      city,
      temperature: 28 + Math.random() * 5,
      humidity: 60 + Math.random() * 20,
      description: 'Partly Cloudy',
      windSpeed: 5 + Math.random() * 10,
      feelsLike: 30,
      pressure: 1013,
      visibility: 10,
      uvIndex: 6,
      timestamp: new Date().toISOString(),
    };

    console.log(`[Weather] Fetched data for ${city}`);
    res.json(weatherData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// ==================== SIMULATOR API ====================
app.post('/api/simulator/start', (req: Request, res: Response) => {
  try {
    const { interval } = req.body || {};

    console.log(`[Simulator] Starting with interval: ${interval || 5000}ms`);

    res.json({
      success: true,
      message: "Simulator started",
      interval: interval || 5000,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start simulator" });
  }
});

app.post('/api/simulator/stop', (req: Request, res: Response) => {
  console.log('[Simulator] Stopped');
  res.json({ success: true, message: "Simulator stopped" });
});

app.post('/api/simulator/generate', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.body || {};
    
    for (const sensor of db.sensors) {
      if (sensor.type === 'temperature') {
        sensor.value = 20 + Math.random() * 10;
      } else if (sensor.type === 'humidity') {
        sensor.value = 40 + Math.random() * 40;
      }
      sensor.timestamp = new Date().toISOString();
      
      // ตรวจสอบ threshold สำหรับแต่ละ sensor
      const deviceId = sensor.sensorId.split('_')[0] || 'unknown';
      await checkThresholdAndCreateAlert(deviceId, sensor.type, sensor.value, userEmail);
    }

    console.log('[Simulator] Data generated');
    res.json({
      success: true,
      message: "Sensor data generated",
      sensors: db.sensors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate data" });
  }
});

// ==================== NOTIFICATIONS API ====================
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(db.notifications);
});

app.post('/api/notifications/email', (req: Request, res: Response) => {
  try {
    const { to, subject, message } = req.body;

    const notification = {
      id: Date.now(),
      to,
      subject,
      message,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    db.notifications.push(notification);

    console.log(`[Email Notification] To: ${to}, Subject: ${subject}`);

    res.json({
      success: true,
      message: "Email sent successfully",
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ==================== THRESHOLDS API ====================
import { thresholdService } from './services/threshold.service.js';
import { sendAlertEmail } from './services/email.service.js';
import { deviceRegistrationService } from './services/device-registration.service.js';

// สร้าง Threshold ใหม่
app.post('/api/thresholds', async (req: Request, res: Response) => {
  try {
    const threshold = await thresholdService.createThreshold(req.body);
    res.json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error creating threshold:', error);
    res.status(500).json({ success: false, error: 'Failed to create threshold' });
  }
});

// ดึง Thresholds ของ Device
app.get('/api/thresholds/device/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const thresholds = await thresholdService.getThresholdsByDevice(deviceId);
    res.json({ success: true, data: thresholds });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch thresholds' });
  }
});

// ดึง Threshold ตาม ID
app.get('/api/thresholds/:id', async (req: Request, res: Response) => {
  try {
    const threshold = await thresholdService.getThresholdById(req.params.id);
    if (!threshold) {
      return res.status(404).json({ success: false, error: 'Threshold not found' });
    }
    res.json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error fetching threshold:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch threshold' });
  }
});

// อัปเดต Threshold
app.put('/api/thresholds/:id', async (req: Request, res: Response) => {
  try {
    const threshold = await thresholdService.updateThreshold(req.params.id, req.body);
    res.json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error updating threshold:', error);
    res.status(500).json({ success: false, error: 'Failed to update threshold' });
  }
});

// ลบ Threshold
app.delete('/api/thresholds/:id', async (req: Request, res: Response) => {
  try {
    await thresholdService.deleteThreshold(req.params.id);
    res.json({ success: true, message: 'Threshold deleted successfully' });
  } catch (error) {
    console.error('Error deleting threshold:', error);
    res.status(500).json({ success: false, error: 'Failed to delete threshold' });
  }
});

// ดึง Notifications ของ Device
app.get('/api/alerts/device/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { limit } = req.query;
    const notifications = await thresholdService.getNotificationsByDevice(
      deviceId, 
      limit ? parseInt(limit as string) : 50
    );
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// ดึง Notifications ที่ยังไม่ได้อ่าน
app.get('/api/alerts/unread', async (req: Request, res: Response) => {
  try {
    const notifications = await thresholdService.getUnreadNotifications();
    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// ทำเครื่องหมายว่าอ่านแล้ว
app.put('/api/alerts/:id/read', async (req: Request, res: Response) => {
  try {
    await thresholdService.markNotificationAsRead(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// ลบ Notification
app.delete('/api/alerts/:id', async (req: Request, res: Response) => {
  try {
    await thresholdService.deleteNotification(req.params.id);
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// ทดสอบการสร้าง alert ด้วยตนเอง (test endpoint)
app.post('/api/alerts/test', async (req: Request, res: Response) => {
  try {
    const { deviceId, sensorType, value, message, level } = req.body;
    
    const notification = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: deviceId || 'TEST_DEVICE',
      sensorType: sensorType || 'temperature',
      message: message || `🚨 Test Alert - ค่า ${value || 0} เกินขีดจำกัด`,
      level: level || 'critical',
      value: value || 0,
      time: new Date().toISOString(),
      isRead: false,
    };

    db.notifications.push(notification);
    console.log(`[Test Alert Created] ${notification.message}`);

    res.json({ success: true, notification });
  } catch (error) {
    console.error('[Test Alert Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to create test alert' });
  }
});

// ==================== DEVICE REGISTRATION API ====================

// ลงทะเบียนอุปกรณ์ใหม่
app.post('/api/devices/register', async (req: Request, res: Response) => {
  try {
    const { macAddress, ipAddress, typeHint, firmwareVersion } = req.body;
    
    if (!macAddress) {
      return res.status(400).json({
        success: false,
        error: 'macAddress is required'
      });
    }

    const device = await deviceRegistrationService.registerDevice({
      macAddress,
      ipAddress: ipAddress || 'unknown',
      type: typeHint || 'sensor',
      firmwareVersion: firmwareVersion || '1.0.0'
    });

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register device'
    });
  }
});

// ดึงรายการอุปกรณ์ทั้งหมด
app.get('/api/devices', async (req: Request, res: Response) => {
  try {
    const devices = await deviceRegistrationService.getAllDevices();
    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices'
    });
  }
});

// ดึงอุปกรณ์จาก ID
app.get('/api/devices/:id', async (req: Request, res: Response) => {
  try {
    const device = await deviceRegistrationService.getDeviceById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device'
    });
  }
});

// อัปเดตชื่ออุปกรณ์
app.put('/api/devices/:id/name', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required'
      });
    }

    const device = await deviceRegistrationService.updateDeviceName(req.params.id, name);
    
    res.json({
      success: true,
      message: 'Device name updated successfully',
      data: device
    });
  } catch (error) {
    console.error('Error updating device name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device name'
    });
  }
});

// อัปเดตประเภทอุปกรณ์
app.put('/api/devices/:id/type', async (req: Request, res: Response) => {
  try {
    const { deviceType } = req.body;
    
    if (!deviceType) {
      return res.status(400).json({
        success: false,
        error: 'deviceType is required'
      });
    }

    const device = await deviceRegistrationService.updateDeviceType(req.params.id, deviceType);
    
    res.json({
      success: true,
      message: 'Device type updated successfully',
      data: device
    });
  } catch (error) {
    console.error('Error updating device type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device type'
    });
  }
});

// อัปเดตสถานะอุปกรณ์
app.put('/api/devices/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required'
      });
    }

    const device = await deviceRegistrationService.updateDeviceStatus(req.params.id, status);
    
    res.json({
      success: true,
      message: 'Device status updated successfully',
      data: device
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status'
    });
  }
});

// ลบอุปกรณ์
app.delete('/api/devices/:id', async (req: Request, res: Response) => {
  try {
    await deviceRegistrationService.deleteDevice(req.params.id);
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete device'
    });
  }
});

// ==================== DynamoDB API ====================

// GET: ข้อมูล Sensor ตาม deviceId
app.get('/api/sensor/data', async (req: Request, res: Response) => {
  try {
    const { deviceId, limit } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'deviceId is required',
      });
    }

    const data = await sensorService.getSensorData(
      deviceId as string,
      parseInt(limit as string) || 20
    );

    res.json({
      success: true,
      deviceId: deviceId,
      count: data.length,
      data: data,
    });
  } catch (error: any) {
    console.error('[API Error] getSensorData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor data',
      message: error.message,
    });
  }
});

// GET: ข้อมูล Sensor ทั้งหมด
app.get('/api/sensor/all', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const data = await sensorService.getAllSensorData(parseInt(limit as string) || 50);

    res.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error: any) {
    console.error('[API Error] getAllSensorData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all sensor data',
      message: error.message,
    });
  }
});

// GET: ข้อมูล Sensor ตามช่วงเวลา
app.get('/api/sensor/timerange', async (req: Request, res: Response) => {
  try {
    const { deviceId, startTime, endTime } = req.query;

    if (!deviceId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'deviceId, startTime, and endTime are required',
      });
    }

    const data = await sensorService.getSensorDataByTimeRange(
      deviceId as string,
      parseInt(startTime as string),
      parseInt(endTime as string)
    );

    res.json({
      success: true,
      deviceId: deviceId,
      count: data.length,
      data: data,
    });
  } catch (error: any) {
    console.error('[API Error] getSensorDataByTimeRange:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor data by time range',
      message: error.message,
    });
  }
});

// GET: สถานะอุปกรณ์ตาม deviceId
app.get('/api/device/status/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = await deviceService.getDeviceStatus(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    res.json({
      success: true,
      device: device,
    });
  } catch (error: any) {
    console.error('[API Error] getDeviceStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device status',
      message: error.message,
    });
  }
});

// GET: สถานะอุปกรณ์ทั้งหมด
app.get('/api/device/all', async (req: Request, res: Response) => {
  try {
    const devices = await deviceService.getAllDevices();

    res.json({
      success: true,
      count: devices.length,
      devices: devices,
    });
  } catch (error: any) {
    console.error('[API Error] getAllDevices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all devices',
      message: error.message,
    });
  }
});

// POST: อัปเดตสถานะอุปกรณ์
app.post('/api/device/update', async (req: Request, res: Response) => {
  try {
    const { deviceId, status, data } = req.body;

    if (!deviceId || !status) {
      return res.status(400).json({
        success: false,
        error: 'deviceId and status are required',
      });
    }

    const updatedDevice = await deviceService.updateDeviceStatus(
      deviceId,
      status,
      data || {}
    );

    res.json({
      success: true,
      message: 'Device status updated',
      device: updatedDevice,
    });
  } catch (error: any) {
    console.error('[API Error] updateDeviceStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status',
      message: error.message,
    });
  }
});

// POST: สร้างอุปกรณ์ใหม่
app.post('/api/device/create', async (req: Request, res: Response) => {
  try {
    const { deviceId, name, type, location } = req.body;

    if (!deviceId || !name || !type) {
      return res.status(400).json({
        success: false,
        error: 'deviceId, name, and type are required',
      });
    }

    const newDevice = await deviceService.createDevice(
      deviceId,
      name,
      type,
      location
    );

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      device: newDevice,
    });
  } catch (error: any) {
    console.error('[API Error] createDevice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create device',
      message: error.message,
    });
  }
});

// ==================== Authentication Routes ====================

// Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user already exists - try QueryCommand first, fallback to ScanCommand
    let existingUser = null;
    try {
      const checkParams = {
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail
        }
      };
      const result = await dynamoDb.send(new QueryCommand(checkParams));
      if (result.Items && result.Items.length > 0) {
        existingUser = result.Items[0];
      }
    } catch (queryError) {
      // EmailIndex might not exist, fallback to Scan
      console.warn('[Register] QueryCommand failed, trying ScanCommand:', queryError);
      
      try {
        const scanParams = {
          TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': normalizedEmail
          }
        };

        const scanResult = await dynamoDb.send(new ScanCommand(scanParams));
        if (scanResult.Items && scanResult.Items.length > 0) {
          existingUser = scanResult.Items[0];
        }
      } catch (scanError) {
        console.warn('[Register] Both Query and Scan failed:', scanError);
      }
    }

    if (existingUser) {
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้ลงทะเบียนแล้ว' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = randomUUID();
    const role = 'user';
    const createdAt = new Date().toISOString();

    // Generate and store refresh token hash (rotation on login/refresh)
    const accessToken = generateAccessToken({ userId, email: normalizedEmail, role });
    const refreshToken = generateRefreshToken({ userId, email: normalizedEmail, role });
    const refreshTokenHash = await hashPassword(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

    // Create user in DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Item: {
        userId,
        email: normalizedEmail,
        name: name || '',
        role,
        passwordHash,
        refreshTokenHash,
        refreshTokenExpiresAt,
        createdAt,
        updatedAt: createdAt
      }
    };

    try {
      await dynamoDb.send(new PutCommand(params));
    } catch (putError) {
      console.error('[Register] Failed to create user:', putError);
      return res.status(500).json({ error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง' });
    }

    // Send welcome email notification (non-blocking)
    try {
      sendWelcomeEmail({
        email: email.toLowerCase().trim(),
        name: name || 'ผู้ใช้งานใหม่',
        userId
      }).then((emailSent) => {
        // Log notification to DynamoDB
        logNotification(
          dynamoDb,
          userId,
          email.toLowerCase().trim(),
          'welcome',
          emailSent ? 'sent' : 'failed',
          emailSent ? 'ส่งอีเมลต้อนรับสำเร็จ' : 'ไม่สามารถส่งอีเมลได้'
        );
      });
    } catch (emailError) {
      console.warn('[Register] Failed to send welcome email:', emailError);
    }

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        userId,
        email: normalizedEmail,
        name: name || '',
        role,
        createdAt: params.Item.createdAt
      },
      message: 'ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณ'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'ลงทะเบียนไม่สำเร็จ' });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมล' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Find user by email using GSI (EmailIndex)
    let user: any = null;
    try {
      const queryParams = {
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail
        }
      };
      const result = await dynamoDb.send(new QueryCommand(queryParams));
      if (result.Items && result.Items.length > 0) {
        user = result.Items[0];
      }
    } catch (queryError) {
      console.error('[Forgot Password] Query via EmailIndex failed. Ensure GSI "EmailIndex" exists on email.', queryError);
      return res.status(500).json({ error: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง' });
    }

    // Respond success even if not found to avoid user enumeration
    if (!user) {
      return res.json({ success: true, message: 'หากอีเมลถูกต้อง ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว' });
    }

    const resetToken = randomUUID();
    const resetTokenHash = await hashPassword(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    try {
      await dynamoDb.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        Key: { userId: user.userId },
        UpdateExpression: 'SET resetTokenHash = :hash, resetTokenExpiresAt = :exp, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':hash': resetTokenHash,
          ':exp': resetTokenExpiresAt,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    } catch (updateError) {
      console.error('[Forgot Password] Failed to store reset token:', updateError);
      return res.status(500).json({ error: 'ไม่สามารถสร้างลิงก์รีเซ็ตรหัสผ่านได้' });
    }

    // Send reset email (non-blocking)
    console.log('[Forgot Password] Sending reset email to:', normalizedEmail);
    sendPasswordResetEmail({
      email: normalizedEmail,
      name: user.name || 'ผู้ใช้งาน',
      userId: user.userId,
      token: resetToken,
    }).then((sent) => {
      if (sent) {
        console.log('[Forgot Password] ✅ Reset email sent successfully');
      } else {
        console.warn('[Forgot Password] ⚠️ Reset email send failed');
      }
    }).catch((err) => console.error('[Forgot Password] ❌ Exception sending reset email:', err));

    return res.json({ success: true, message: 'หากอีเมลถูกต้อง ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, userId, newPassword } = req.body;

    if (!token || !userId || !newPassword) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const userResult = await dynamoDb.send(new GetCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Key: { userId },
    }));

    if (!userResult.Item) {
      return res.status(400).json({ error: 'ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ' });
    }

    const user = userResult.Item as any;

    if (!user.resetTokenHash || !user.resetTokenExpiresAt) {
      return res.status(400).json({ error: 'ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ' });
    }

    if (new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'ลิงก์รีเซ็ตหมดอายุแล้ว' });
    }

    const tokenValid = await verifyPassword(token, user.resetTokenHash);
    if (!tokenValid) {
      return res.status(400).json({ error: 'ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ' });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await dynamoDb.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Key: { userId },
      UpdateExpression: 'SET passwordHash = :pwd, updatedAt = :updatedAt REMOVE resetTokenHash, resetTokenExpiresAt',
      ExpressionAttributeValues: {
        ':pwd': newPasswordHash,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบใหม่' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Login user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rateKey = `${req.ip || 'unknown'}:${normalizedEmail}`;
    const attempt = incrementLoginAttempt(rateKey);
    if (attempt.blocked) {
      return res.status(429).json({ error: 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง' });
    }

    // Find user by email - try QueryCommand first, fallback to ScanCommand
    let user = null;
    try {
      const queryParams = {
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail
        }
      };

      const result = await dynamoDb.send(new QueryCommand(queryParams));
      if (result.Items && result.Items.length > 0) {
        user = result.Items[0];
      }
    } catch (queryError) {
      // EmailIndex might not exist, fallback to Scan
      console.warn('[Login] QueryCommand failed, trying ScanCommand:', queryError);
      
      try {
        const scanParams = {
          TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': normalizedEmail
          }
        };

        const scanResult = await dynamoDb.send(new ScanCommand(scanParams));
        if (scanResult.Items && scanResult.Items.length > 0) {
          user = scanResult.Items[0];
        }
      } catch (scanError) {
        console.error('[Login] Both Query and Scan failed:', scanError);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const role = user.role || 'user';

    // Rotate refresh token
    const accessToken = generateAccessToken({ userId: user.userId, email: normalizedEmail, role });
    const refreshToken = generateRefreshToken({ userId: user.userId, email: normalizedEmail, role });
    const refreshTokenHash = await hashPassword(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

    try {
      await dynamoDb.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
        Key: { userId: user.userId },
        UpdateExpression: 'SET refreshTokenHash = :hash, refreshTokenExpiresAt = :exp, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':hash': refreshTokenHash,
          ':exp': refreshTokenExpiresAt,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    } catch (updateError) {
      console.warn('[Login] Failed to update refresh token:', updateError);
      // Don't fail the entire login, just warn
    }

    // Log login notification
    try {
      logNotification(
        dynamoDb,
        user.userId,
        normalizedEmail,
        'login',
        'sent',
        `User logged in successfully at ${new Date().toLocaleString('th-TH')}`
      );
    } catch (logError) {
      console.warn('[Login] Failed to log notification:', logError);
    }

    setAuthCookies(res, accessToken, refreshToken);
    loginAttempts[rateKey] = { count: 0, firstAttempt: Date.now() };

    res.json({
      success: true,
      accessToken,
      user: {
        userId: user.userId,
        email: normalizedEmail,
        name: user.name || '',
        role,
        createdAt: user.createdAt
      },
      message: 'เข้าสู่ระบบสำเร็จ'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Refresh access token using refresh token rotation
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const incomingRefresh = (req as any).cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!incomingRefresh || typeof incomingRefresh !== 'string') {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = verifyRefreshToken(incomingRefresh);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const userResult = await dynamoDb.send(new GetCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Key: { userId: decoded.userId },
    }));

    if (!userResult.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.Item as any;
    if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      return res.status(401).json({ error: 'Refresh token revoked' });
    }

    if (new Date(user.refreshTokenExpiresAt).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const tokenMatch = await verifyPassword(incomingRefresh, user.refreshTokenHash);
    if (!tokenMatch) {
      return res.status(401).json({ error: 'Refresh token mismatch' });
    }

    const role = user.role || 'user';
    const accessToken = generateAccessToken({ userId: user.userId, email: user.email, role });
    const refreshToken = generateRefreshToken({ userId: user.userId, email: user.email, role });
    const refreshTokenHash = await hashPassword(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

    await dynamoDb.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Key: { userId: user.userId },
      UpdateExpression: 'SET refreshTokenHash = :hash, refreshTokenExpiresAt = :exp, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':hash': refreshTokenHash,
        ':exp': refreshTokenExpiresAt,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        role,
        name: user.name || '',
        createdAt: user.createdAt,
      },
      message: 'Token refreshed'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout and revoke refresh token
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const incomingRefresh = (req as any).cookies?.refreshToken || req.body?.refreshToken;
    if (incomingRefresh && typeof incomingRefresh === 'string') {
      const decoded = verifyRefreshToken(incomingRefresh);
      if (decoded?.userId) {
        await dynamoDb.send(new UpdateCommand({
          TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
          Key: { userId: decoded.userId },
          UpdateExpression: 'SET updatedAt = :updatedAt REMOVE refreshTokenHash, refreshTokenExpiresAt',
          ExpressionAttributeValues: {
            ':updatedAt': new Date().toISOString(),
          },
        })).catch(() => {
          // Token revocation failed, continue logout
        });
      }
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      Key: {
        userId: req.user!.userId
      }
    };

    const result = await dynamoDb.send(new GetCommand(params));

    if (!result.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, refreshTokenHash, refreshTokenExpiresAt, ...user } = result.Item as any;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ==================== Serve Frontend Static Files ====================
// หมายเหตุ: Frontend รันบน Next.js dev server (port 3000)
// Backend เสิร์ฟเฉพาะ API endpoints เท่านั้น
// ไม่จำเป็นต้องเสิร์ฟ static files จาก backend

// Catch-all route: ส่งกลับข้อมูลเซิร์ฟเวอร์สำหรับ non-API routes
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'ไม่พบ API endpoint นี้' });
  }
  
  // ส่งกลับ 200 พร้อมข้อมูลเซิร์ฟเวอร์สำหรับ non-API routes
  res.status(200).json({ 
    status: 'Backend API Server',
    info: 'Frontend รันบน client dev server',
    message: 'Backend (port 3000) เสิร์ฟเฉพาะ API endpoints เท่านั้น',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==================== Start Server ====================
function startServer(port: number, attemptsLeft = 5) {
  const srv = app.listen(port, '0.0.0.0' as any, () => {
    console.log(`🚀 Backend API running on port ${port}`);
    console.log(`📊 Health check: /health`);
    console.log(`🔌 CORS enabled for frontend requests`);
    console.log(`📡 DynamoDB API endpoints active`);
  });

  srv.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`[Server] Port ${port} in use. Trying ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
    } else {
      console.error('[Server] Failed to start server:', err);
      process.exit(1);
    }
  });

  return srv;
}

const server = startServer(PORT);

export default app;
