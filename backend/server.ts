import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import sensorService from './services/sensor.service.js';
import deviceService from './services/device.service.js';
import { PutCommand, QueryCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './aws/dynamodb.js';
import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, authenticate, AuthRequest, verifyRefreshToken, ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './middleware/auth.js';
import { sendWelcomeEmail, logNotification } from './services/email.service.js';

dotenv.config();

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

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
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
app.post('/api/iot/publish', (req: Request, res: Response) => {
  try {
    const { topic, command } = req.body;

    console.log(`[AWS IoT Publish] Topic: ${topic}`, command);

    res.json({
      success: true,
      message: "Command sent to device",
      topic,
      command,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to publish command" });
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
        }).catch(() => undefined);
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

// ==================== Error Handling ====================
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== Start Server ====================
const server = app.listen(PORT, '0.0.0.0' as any, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📊 Health check: /health`);
  console.log(`🔌 CORS enabled for frontend requests`);
  console.log(`📡 DynamoDB API endpoints active`);
});

export default app;
