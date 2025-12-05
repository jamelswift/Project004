import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== In-Memory Database ====================
const db = {
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

// ==================== API Routes ====================

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== DEVICES API ====================
app.get('/api/devices', (req, res) => {
  res.json(db.devices);
});

app.get('/api/devices/:deviceId', (req, res) => {
  const device = db.devices.find(d => d.deviceId === req.params.deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json(device);
});

app.post('/api/devices', (req, res) => {
  try {
    const { deviceId, status } = req.body;

    const deviceIndex = db.devices.findIndex((d) => d.deviceId === deviceId);
    if (deviceIndex !== -1) {
      db.devices[deviceIndex].status = status;
      db.devices[deviceIndex].lastUpdate = new Date().toISOString();

      // Log to console
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

// ==================== SENSORS API ====================
app.get('/api/sensors', (req, res) => {
  res.json(db.sensors);
});

app.get('/api/sensors/:sensorId', (req, res) => {
  const sensor = db.sensors.find(s => s.sensorId === req.params.sensorId);
  if (!sensor) {
    return res.status(404).json({ error: 'Sensor not found' });
  }
  res.json(sensor);
});

app.post('/api/sensors', (req, res) => {
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
app.post('/api/iot/publish', (req, res) => {
  try {
    const { topic, command } = req.body;

    console.log(`[AWS IoT Publish] Topic: ${topic}`, command);

    // ในการใช้งานจริง ให้ส่ง MQTT message ไปยัง AWS IoT Core
    // ตอนนี้จำลองการทำงาน

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
app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city || 'Bangkok';

    // Mock weather data (ในการใช้งานจริง เรียก OpenWeatherMap API)
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
app.post('/api/simulator/start', (req, res) => {
  try {
    const { interval } = req.body || {};

    console.log(`[Simulator] Starting with interval: ${interval || 5000}ms`);

    // จำลองการส่งข้อมูล sensor
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

app.post('/api/simulator/stop', (req, res) => {
  console.log('[Simulator] Stopped');
  res.json({ success: true, message: "Simulator stopped" });
});

app.post('/api/simulator/generate', (req, res) => {
  try {
    // จำลองการสร้างข้อมูล sensor แบบสุ่ม
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
app.get('/api/notifications', (req, res) => {
  res.json(db.notifications);
});

app.post('/api/notifications/email', (req, res) => {
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

// ==================== Error Handling ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 CORS enabled for frontend requests`);
});
