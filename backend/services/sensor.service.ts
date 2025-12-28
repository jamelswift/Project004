/**
 * Sensor Service
 * จัดการข้อมูล Sensor จาก DynamoDB
 */

import { QueryCommand, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../aws/dynamodb.js";
import { thresholdService } from "./threshold.service.js";
import { sendAlertEmail } from "./email.service.js";

// Type Definitions
interface SensorData {
  deviceId: string;
  timestamp: number;
  temperature?: number;
  humidity?: number;
  value?: number;
  unit?: string;
  status?: string;
  [key: string]: any;
}

interface QueryResponse {
  Items?: SensorData[];
  Count?: number;
  LastEvaluatedKey?: any;
}

const SENSOR_DATA_TABLE = process.env.DYNAMODB_SENSOR_DATA_TABLE || "SensorData";

export class SensorService {
  /**
   * ดึงข้อมูล Sensor ตาม deviceId
   * @param deviceId - รหัสอุปกรณ์ เช่น ESP32_001
   * @param limit - จำนวนข้อมูลที่ต้องการ (default: 20)
   */
  async getSensorData(deviceId: string, limit: number = 20): Promise<SensorData[]> {
    try {
      if (!deviceId) {
        throw new Error("deviceId is required");
      }

      const command = new QueryCommand({
        TableName: SENSOR_DATA_TABLE,
        KeyConditionExpression: "deviceId = :deviceId",
        ExpressionAttributeValues: {
          ":deviceId": deviceId,
        },
        ScanIndexForward: false, // เรียงจากใหม่ไปเก่า (timestamp ล่าสุดก่อน)
        Limit: limit,
      });

      const response = (await dynamoDb.send(command)) as QueryResponse;
      return response.Items || [];
    } catch (error) {
      console.error("[DynamoDB Error] getSensorData:", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Sensor ทั้งหมด (ล่าสุด)
   * @param limit - จำนวนข้อมูล
   */
  async getAllSensorData(limit: number = 50): Promise<SensorData[]> {
    try {
      const command = new ScanCommand({
        TableName: SENSOR_DATA_TABLE,
        Limit: limit,
      });

      const response = (await dynamoDb.send(command)) as QueryResponse;
      return response.Items || [];
    } catch (error) {
      console.error("[DynamoDB Error] getAllSensorData:", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Sensor ตามช่วงเวลา
   * @param deviceId - รหัสอุปกรณ์
   * @param startTime - Unix timestamp (milliseconds)
   * @param endTime - Unix timestamp (milliseconds)
   */
  async getSensorDataByTimeRange(
    deviceId: string,
    startTime: number,
    endTime: number
  ): Promise<SensorData[]> {
    try {
      if (!deviceId || !startTime || !endTime) {
        throw new Error("deviceId, startTime, and endTime are required");
      }

      if (startTime > endTime) {
        throw new Error("startTime must be less than endTime");
      }

      const command = new QueryCommand({
        TableName: SENSOR_DATA_TABLE,
        KeyConditionExpression: "deviceId = :deviceId AND #ts BETWEEN :start AND :end",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
          ":deviceId": deviceId,
          ":start": startTime,
          ":end": endTime,
        },
        ScanIndexForward: false,
      });

      const response = (await dynamoDb.send(command)) as QueryResponse;
      return response.Items || [];
    } catch (error) {
      console.error("[DynamoDB Error] getSensorDataByTimeRange:", error);
      throw error;
    }
  }

  /**
   * ดึงจำนวนข้อมูล Sensor ทั้งหมด
   * @param deviceId - รหัสอุปกรณ์
   */
  async getSensorCount(deviceId: string): Promise<number> {
    try {
      if (!deviceId) {
        throw new Error("deviceId is required");
      }

      const command = new QueryCommand({
        TableName: SENSOR_DATA_TABLE,
        KeyConditionExpression: "deviceId = :deviceId",
        ExpressionAttributeValues: {
          ":deviceId": deviceId,
        },
        Select: "COUNT",
      });

      const response = (await dynamoDb.send(command)) as any;
      return response.Count || 0;
    } catch (error) {
      console.error("[DynamoDB Error] getSensorCount:", error);
      throw error;
    }
  }

  /**
   * บันทึกข้อมูล Sensor และตรวจสอบค่าขีดจำกัด
   * @param sensorData - ข้อมูลเซ็นเซอร์ที่จะบันทึก
   */
  async saveSensorData(sensorData: SensorData): Promise<{ saved: boolean; alerts?: any[] }> {
    try {
      // บันทึกข้อมูล
      const command = new PutCommand({
        TableName: SENSOR_DATA_TABLE,
        Item: sensorData,
      });
      await dynamoDb.send(command);

      // ตรวจสอบ thresholds สำหรับแต่ละประเภทเซ็นเซอร์
      const alerts: any[] = [];
      const sensorTypes = ["temperature", "humidity", "light", "pm25", "rain"];

      for (const sensorType of sensorTypes) {
        const value = sensorData[sensorType];
        if (value !== undefined && value !== null) {
          const result = await thresholdService.checkThresholds(
            sensorData.deviceId,
            sensorType,
            value
          );

          if (result.violated && result.threshold && result.type) {
            // สร้างข้อความแจ้งเตือน
            const message = thresholdService.generateThresholdMessage(
              sensorData.deviceId,
              sensorType,
              value,
              result.type === "max" ? result.threshold.maxValue! : result.threshold.minValue!,
              result.type
            );

            // กำหนดระดับความรุนแรง
            const severity = thresholdService.determineSeverity(
              value,
              result.type === "max" ? result.threshold.maxValue! : result.threshold.minValue!,
              result.type
            );

            // สร้าง notification
            const alert = await thresholdService.createNotification({
              deviceId: sensorData.deviceId,
              sensorType,
              currentValue: value,
              thresholdValue: result.type === "max" ? result.threshold.maxValue! : result.threshold.minValue!,
              thresholdType: result.type,
              message,
              severity,
            });

            alerts.push(alert);

            // ส่งอีเมลแจ้งเตือนถ้าเปิดใช้งาน
            if (result.threshold.notifyEmail) {
              try {
                await sendAlertEmail(
                  process.env.ADMIN_EMAIL || "admin@iot-system.com",
                  `⚠️ แจ้งเตือนค่าเซ็นเซอร์เกินขีดจำกัด - ${sensorData.deviceId}`,
                  message
                );
              } catch (emailError) {
                console.error("Failed to send email notification:", emailError);
              }
            }

            console.log(`[Threshold Alert] ${message}`);
          }
        }
      }

      return { saved: true, alerts: alerts.length > 0 ? alerts : undefined };
    } catch (error) {
      console.error("[DynamoDB Error] saveSensorData:", error);
      throw error;
    }
  }
}

export default new SensorService();
