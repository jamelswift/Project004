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
import { sendWelcomeEmail, logNotification } from './services/email.service.js';
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
const PORT = parseInt(process.env.PORT || '5000', 10);

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
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
    });

    mqttClient.on('connect', () => {
      console.log('[MQTT] ✅ Connected to AWS IoT Core');
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
app.use(cors({
  origin: true, // ✅ Allow all origins temporarily for debugging/testing
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
      sensorId: "TEMP_001",
      name: "อุณหภูมิห้องนั่งเล่น",
      type: "temperature",
      value: 25.5,
      unit: "°C",
      timestamp: new Date().toISOString(),
      location: "Living Room",
    },
    {
      sensorId: "HUMIDITY_001",
      name: "ความชื้นห้องนั่งเล่น",
      type: "humidity",
      value: 65,
      unit: "%",
      timestamp: new Date().toISOString(),
      location: "Living Room",
    },
    {
      sensorId: "TEMP_002",
      name: "อุณหภูมิห้องนอน",
      type: "temperature",
      value: 23.8,
      unit: "°C",
      timestamp: new Date().toISOString(),
      location: "Bedroom",
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

// ==================== DEVICES API ====================
app.get('/api/devices', (req: Request, res: Response) => {
  res.json(db.devices);
});

app.get('/api/devices/:deviceId', (req: Request, res: Response) => {
  const device = db.devices.find(d => d.deviceId === req.params.deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json(device);
});

app.post('/api/devices', (req: Request, res: Response) => {
  try {
    const { deviceId, status } = req.body;

    const deviceIndex = db.devices.findIndex((d) => d.deviceId === deviceId);
    if (deviceIndex !== -1) {
      db.devices[deviceIndex].status = status;
      db.devices[deviceIndex].lastUpdate = new Date().toISOString();

      console.log(`[Device Control] ${deviceId} set to ${status}`);

      res.json({ success: true, device: db.devices[deviceIndex] });
    } else {
      res.status(404).json({ error: "Device not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update device" });
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

// GET relay state (for ESP32 to poll)
app.get('/api/relay/state', (req: Request, res: Response) => {
  res.json(relayState);
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
    
    res.json({
      success: true,
      count: result.Items?.length || 0,
      history: result.Items || [],
    });
  } catch (error: any) {
    console.error('[DynamoDB Query Error]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relay history',
      message: error.message,
    });
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

    // Prefer native MQTT client if connected; otherwise fall back to IoT Data Plane
    if (mqttClient && mqttClient.connected) {
      mqttClient.publish(topic, JSON.stringify(message), { qos: 0 }, (error) => {
        if (error) {
          console.error('[Test] MQTT publish error:', error);
          return res.status(500).json({ error: error.message });
        }
        console.log(`[Test] ✅ MQTT Published successfully`);
        return res.json({ success: true, via: 'mqtt', message: 'Published to AWS IoT via MQTT' });
      });
      return;
    }

    if (!iotClient) {
      return res.status(500).json({ error: 'No MQTT connection and IoT client not initialized' });
    }

    const result = await iotClient.send(new PublishCommand({
      topic,
      payload: new TextEncoder().encode(JSON.stringify(message)),
      qos: 0,
    }));
    console.log(`[Test] ✅ IoT Data Plane Published successfully`);
    return res.json({ success: true, via: 'iot-data-plane', message: 'Published to AWS IoT via Data Plane', result });
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
    
    // Publish to AWS IoT MQTT Topics using MQTT Direct Connection
    if (mqttClient && mqttClient.connected) {
      const thingName = process.env.AWS_IOT_THING_NAME || 'esp32-relay-01';
      const commandTopic = `${thingName}/command`;
      
      try {
        // Publish Channel 1 control message if relay1 changed
        if (relay1 !== undefined) {
          const action = relayState.relay1 === 'on' ? 'on' : 'off';
          const message1 = JSON.stringify({
            action: action,
            channel: 1,
          });
          mqttClient.publish(commandTopic, message1, { qos: 0 }, (error) => {
            if (error) {
              console.error(`[MQTT Publish Error] ${commandTopic}:`, error);
            } else {
              console.log(`[MQTT Published] ${commandTopic}: ${message1}`);
            }
          });
        }
        
        // Publish Channel 2 control message if relay2 changed
        if (relay2 !== undefined) {
          const action = relayState.relay2 === 'on' ? 'on' : 'off';
          const message2 = JSON.stringify({
            action: action,
            channel: 2,
          });
          mqttClient.publish(commandTopic, message2, { qos: 0 }, (error) => {
            if (error) {
              console.error(`[MQTT Publish Error] ${commandTopic}:`, error);
            } else {
              console.log(`[MQTT Published] ${commandTopic}: ${message2}`);
            }
          });
        }
      } catch (mqttError: any) {
        console.error('[MQTT Publish Error]', mqttError);
      }
    } else if (iotClient) {
      const thingName = process.env.AWS_IOT_THING_NAME || 'esp32-relay-01';
      const commandTopic = `${thingName}/command`;
      try {
        if (relay1 !== undefined) {
          const action = relayState.relay1 === 'on' ? 'on' : 'off';
          const message1 = JSON.stringify({ action, channel: 1 });
          await iotClient.send(new PublishCommand({
            topic: commandTopic,
            payload: new TextEncoder().encode(message1),
            qos: 0,
          }));
          console.log(`[IoT Published] ${commandTopic}: ${message1}`);
        }
        if (relay2 !== undefined) {
          const action = relayState.relay2 === 'on' ? 'on' : 'off';
          const message2 = JSON.stringify({ action, channel: 2 });
          await iotClient.send(new PublishCommand({
            topic: commandTopic,
            payload: new TextEncoder().encode(message2),
            qos: 0,
          }));
          console.log(`[IoT Published] ${commandTopic}: ${message2}`);
        }
      } catch (iotError: any) {
        console.error('[IoT Publish Error]', iotError);
      }
    } else {
      console.warn('[Publish] No MQTT or IoT client available - skipping publish');
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
app.get('/api/sensors', (req: Request, res: Response) => {
  res.json(db.sensors);
});

app.get('/api/sensors/:sensorId', (req: Request, res: Response) => {
  const sensor = db.sensors.find(s => s.sensorId === req.params.sensorId);
  if (!sensor) {
    return res.status(404).json({ error: 'Sensor not found' });
  }
  res.json(sensor);
});

app.post('/api/sensors', (req: Request, res: Response) => {
  try {
    const { sensorId, value } = req.body;

    const sensorIndex = db.sensors.findIndex((s) => s.sensorId === sensorId);
    if (sensorIndex !== -1) {
      db.sensors[sensorIndex].value = value;
      db.sensors[sensorIndex].timestamp = new Date().toISOString();

      console.log(`[Sensor Update] ${sensorId}: ${value}`);

      res.json({ success: true, sensor: db.sensors[sensorIndex] });
    } else {
      res.status(404).json({ error: "Sensor not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update sensor" });
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
      return res.status(403).json({ error: 'You do not have permission to control this device' });
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

app.post('/api/simulator/generate', (req: Request, res: Response) => {
  try {
    db.sensors.forEach(sensor => {
      if (sensor.type === 'temperature') {
        sensor.value = 20 + Math.random() * 10;
      } else if (sensor.type === 'humidity') {
        sensor.value = 40 + Math.random() * 40;
      }
      sensor.timestamp = new Date().toISOString();
    });

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
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const checkParams = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': normalizedEmail
      }
    };
    const existingUser = await dynamoDb.send(new QueryCommand(checkParams));
    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
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

    await dynamoDb.send(new PutCommand(params));

    // Send welcome email notification (non-blocking)
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
        emailSent ? 'Welcome email sent successfully' : 'Failed to send welcome email'
      );
    });

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
      message: 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณ'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rateKey = `${req.ip || 'unknown'}:${normalizedEmail}`;
    const attempt = incrementLoginAttempt(rateKey);
    if (attempt.blocked) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait a few minutes before trying again.' });
    }

    // Find user by email
    const params = {
      TableName: process.env.DYNAMODB_USERS_TABLE || 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': normalizedEmail
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.Items[0];

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const role = user.role || 'user';

    // Rotate refresh token
    const accessToken = generateAccessToken({ userId: user.userId, email: normalizedEmail, role });
    const refreshToken = generateRefreshToken({ userId: user.userId, email: normalizedEmail, role });
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

    // Log login notification
    logNotification(
      dynamoDb,
      user.userId,
      normalizedEmail,
      'login',
      'sent',
      `User logged in successfully at ${new Date().toLocaleString('th-TH')}`
    );

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
    res.status(500).json({ error: 'Failed to login' });
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
// Serve Next.js static files from frontend/out
const frontendPath = path.join(__dirname, '../../frontend/out');
console.log(`📂 Serving frontend from: ${frontendPath}`);

// Serve static files (JS, CSS, images, etc.)
app.use(express.static(frontendPath, {
  maxAge: '1d',
  etag: true,
}));

// Serve Next.js static assets (_next folder)
app.use('/_next', express.static(path.join(frontendPath, '_next'), {
  maxAge: '1y',
  immutable: true,
}));

// Catch-all route: serve index.html for any non-API route (SPA routing)
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).json({ error: 'Frontend not found. Make sure to build frontend first.' });
    }
  });
});

// ==================== Start Server ====================
const server = app.listen(PORT, '0.0.0.0' as any, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📊 Health check: /health`);
  console.log(`🔌 CORS enabled for frontend requests`);
  console.log(`📡 DynamoDB API endpoints active`);
});

export default app;
