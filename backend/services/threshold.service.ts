/**
 * Threshold Service
 * จัดการค่าขีดจำกัด (Threshold) ของเซ็นเซอร์และการแจ้งเตือน
 */

import { 
  QueryCommand,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../aws/dynamodb.js";

const THRESHOLDS_TABLE = process.env.DYNAMODB_THRESHOLDS_TABLE || "SensorThresholds";
const NOTIFICATIONS_TABLE = process.env.DYNAMODB_NOTIFICATIONS_TABLE || "SensorNotifications";

export interface SensorThreshold {
  id: string;
  deviceId: string;
  sensorType: "temperature" | "humidity" | "light" | "pm25" | "rain";
  minValue?: number;
  maxValue?: number;
  enabled: boolean;
  notifyEmail?: boolean;
  notifyBrowser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationAlert {
  id: string;
  deviceId: string;
  sensorType: string;
  currentValue: number | null;
  thresholdValue: number | null;
  thresholdType?: "min" | "max" | null;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: string;
  read: boolean;
  userId?: string;
}

export class ThresholdService {
  /**
   * สร้าง Threshold ใหม่
   */
  async createThreshold(threshold: Omit<SensorThreshold, "id" | "createdAt" | "updatedAt">): Promise<SensorThreshold> {
    const id = `${threshold.deviceId}_${threshold.sensorType}_${Date.now()}`;
    const now = new Date().toISOString();

    const newThreshold: SensorThreshold = {
      id,
      ...threshold,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: THRESHOLDS_TABLE,
        Item: newThreshold,
      })
    );

    return newThreshold;
  }

  /**
   * ดึง Thresholds ทั้งหมดของ Device
   */
  async getThresholdsByDevice(deviceId: string): Promise<SensorThreshold[]> {
    const command = new QueryCommand({
      TableName: THRESHOLDS_TABLE,
      IndexName: "DeviceIdIndex",
      KeyConditionExpression: "deviceId = :deviceId",
      ExpressionAttributeValues: {
        ":deviceId": deviceId,
      },
    });

    const response = await dynamoDb.send(command);
    return (response.Items as SensorThreshold[]) || [];
  }

  /**
   * ดึง Threshold ตาม ID
   */
  async getThresholdById(id: string): Promise<SensorThreshold | null> {
    const command = new GetCommand({
      TableName: THRESHOLDS_TABLE,
      Key: { id },
    });

    const response = await dynamoDb.send(command);
    return (response.Item as SensorThreshold) || null;
  }

  /**
   * อัปเดต Threshold
   */
  async updateThreshold(id: string, updates: Partial<SensorThreshold>): Promise<SensorThreshold> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // สร้าง update expression dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "createdAt") {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // เพิ่ม updatedAt
    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: THRESHOLDS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const response = await dynamoDb.send(command);
    return response.Attributes as SensorThreshold;
  }

  /**
   * ลบ Threshold
   */
  async deleteThreshold(id: string): Promise<void> {
    await dynamoDb.send(
      new DeleteCommand({
        TableName: THRESHOLDS_TABLE,
        Key: { id },
      })
    );
  }

  /**
   * ตรวจสอบว่าค่าเซ็นเซอร์เกินขีดจำกัดหรือไม่
   */
  async checkThresholds(
    deviceId: string, 
    sensorType: string, 
    value: number
  ): Promise<{ violated: boolean; threshold?: SensorThreshold; type?: "min" | "max" }> {
    const thresholds = await this.getThresholdsByDevice(deviceId);
    
    const relevantThreshold = thresholds.find(
      t => t.sensorType === sensorType && t.enabled
    );

    if (!relevantThreshold) {
      return { violated: false };
    }

    // ตรวจสอบค่าต่ำสุด
    if (relevantThreshold.minValue !== undefined && value < relevantThreshold.minValue) {
      return { violated: true, threshold: relevantThreshold, type: "min" };
    }

    // ตรวจสอบค่าสูงสุด
    if (relevantThreshold.maxValue !== undefined && value > relevantThreshold.maxValue) {
      return { violated: true, threshold: relevantThreshold, type: "max" };
    }

    return { violated: false };
  }

  /**
   * สร้าง Notification Alert
   */
  async createNotification(alert: Omit<NotificationAlert, "id" | "timestamp" | "read">): Promise<NotificationAlert> {
    const id = `alert_${alert.deviceId}_${Date.now()}`;
    
    const notification: NotificationAlert = {
      id,
      ...alert,
      currentValue: alert.currentValue ?? null,
      thresholdValue: alert.thresholdValue ?? null,
      thresholdType: alert.thresholdType ?? null,
      timestamp: new Date().toISOString(),
      read: false,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: notification,
      })
    );

    return notification;
  }

  /**
   * ดึง Notifications ของ Device
   */
  async getNotificationsByDevice(deviceId: string, limit: number = 50): Promise<NotificationAlert[]> {
    const command = new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      IndexName: "DeviceIdIndex",
      KeyConditionExpression: "deviceId = :deviceId",
      ExpressionAttributeValues: {
        ":deviceId": deviceId,
      },
      ScanIndexForward: false,
      Limit: limit,
    });

    const response = await dynamoDb.send(command);
    return (response.Items as NotificationAlert[]) || [];
  }

  /**
   * ดึง Notifications ทั้งหมดที่ยังไม่ได้อ่าน
   */
  async getUnreadNotifications(userId?: string): Promise<NotificationAlert[]> {
    const command = new ScanCommand({
      TableName: NOTIFICATIONS_TABLE,
      FilterExpression: "#read = :read",
      ExpressionAttributeNames: {
        "#read": "read",
      },
      ExpressionAttributeValues: {
        ":read": false,
      },
    });

    const response = await dynamoDb.send(command);
    return (response.Items as NotificationAlert[]) || [];
  }

  /**
   * ทำเครื่องหมาย Notification ว่าอ่านแล้ว
   */
  async markNotificationAsRead(id: string): Promise<void> {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: NOTIFICATIONS_TABLE,
        Key: { id },
        UpdateExpression: "SET #read = :read",
        ExpressionAttributeNames: {
          "#read": "read",
        },
        ExpressionAttributeValues: {
          ":read": true,
        },
      })
    );
  }

  /**
   * ลบ Notification
   */
  async deleteNotification(id: string): Promise<void> {
    await dynamoDb.send(
      new DeleteCommand({
        TableName: NOTIFICATIONS_TABLE,
        Key: { id },
      })
    );
  }

  /**
   * สร้างข้อความแจ้งเตือนภาษาไทย
   */
  generateThresholdMessage(
    deviceId: string,
    sensorType: string,
    value: number,
    thresholdValue: number,
    type: "min" | "max"
  ): string {
    const sensorNames: Record<string, string> = {
      temperature: "อุณหภูมิ",
      humidity: "ความชื้น",
      light: "แสง",
      pm25: "PM2.5",
      rain: "ฝน",
    };

    const sensorName = sensorNames[sensorType] || sensorType;
    const comparison = type === "max" ? "สูงกว่า" : "ต่ำกว่า";

    return `⚠️ ${sensorName}ของ ${deviceId} ${comparison}ค่าที่กำหนด! ค่าปัจจุบัน: ${value}, ค่าที่กำหนด: ${thresholdValue}`;
  }

  /**
   * กำหนดระดับความรุนแรงของการแจ้งเตือน
   */
  determineSeverity(
    value: number,
    thresholdValue: number,
    type: "min" | "max"
  ): "info" | "warning" | "error" | "critical" {
    const diff = Math.abs(value - thresholdValue);
    const percentDiff = (diff / thresholdValue) * 100;

    if (percentDiff > 50) return "critical";
    if (percentDiff > 30) return "error";
    if (percentDiff > 10) return "warning";
    return "info";
  }
}

export const thresholdService = new ThresholdService();
