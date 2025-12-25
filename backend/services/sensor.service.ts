/**
 * Sensor Service
 * จัดการข้อมูล Sensor จาก DynamoDB
 */

import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../aws/dynamodb.js";

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
}

export default new SensorService();
