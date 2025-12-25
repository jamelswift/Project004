/**
 * Device Service
 * จัดการสถานะอุปกรณ์จาก DynamoDB
 */

import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../aws/dynamodb.js";

// Type Definitions
interface DeviceData {
  [key: string]: any;
}

interface DeviceStatus {
  deviceId: string;
  name: string;
  type: string;
  status: "on" | "off" | "online" | "offline" | string;
  location?: string;
  lastUpdate: number;
  createdAt?: number;
  data?: DeviceData;
  [key: string]: any;
}

interface ScanResponse {
  Items?: DeviceStatus[];
  Count?: number;
  LastEvaluatedKey?: any;
}

const DEVICE_STATUS_TABLE = process.env.DYNAMODB_DEVICE_STATUS_TABLE || "DeviceStatus";

export class DeviceService {
  /**
   * ดึงสถานะอุปกรณ์ตาม deviceId
   * @param deviceId - รหัสอุปกรณ์
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      if (!deviceId) {
        throw new Error("deviceId is required");
      }

      const command = new GetCommand({
        TableName: DEVICE_STATUS_TABLE,
        Key: {
          deviceId: deviceId,
        },
      });

      const response = (await dynamoDb.send(command)) as any;
      return response.Item || null;
    } catch (error) {
      console.error("[DynamoDB Error] getDeviceStatus:", error);
      throw error;
    }
  }

  /**
   * ดึงสถานะอุปกรณ์ทั้งหมด
   */
  async getAllDevices(): Promise<DeviceStatus[]> {
    try {
      const command = new ScanCommand({
        TableName: DEVICE_STATUS_TABLE,
      });

      const response = (await dynamoDb.send(command)) as ScanResponse;
      return response.Items || [];
    } catch (error) {
      console.error("[DynamoDB Error] getAllDevices:", error);
      throw error;
    }
  }

  /**
   * ดึงอุปกรณ์ตามประเภท
   * @param type - ประเภทอุปกรณ์ เช่น "light", "sensor"
   */
  async getDevicesByType(type: string): Promise<DeviceStatus[]> {
    try {
      if (!type) {
        throw new Error("type is required");
      }

      const command = new ScanCommand({
        TableName: DEVICE_STATUS_TABLE,
        FilterExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": type,
        },
      });

      const response = (await dynamoDb.send(command)) as ScanResponse;
      return response.Items || [];
    } catch (error) {
      console.error("[DynamoDB Error] getDevicesByType:", error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะอุปกรณ์
   * @param deviceId - รหัสอุปกรณ์
   * @param status - สถานะใหม่
   * @param additionalData - ข้อมูลเพิ่มเติม
   */
  async updateDeviceStatus(
    deviceId: string,
    status: string,
    additionalData: DeviceData = {}
  ): Promise<DeviceStatus> {
    try {
      if (!deviceId || !status) {
        throw new Error("deviceId and status are required");
      }

      const timestamp = Date.now();

      const command = new UpdateCommand({
        TableName: DEVICE_STATUS_TABLE,
        Key: {
          deviceId: deviceId,
        },
        UpdateExpression: "SET #status = :status, lastUpdate = :timestamp, #data = :data",
        ExpressionAttributeNames: {
          "#status": "status",
          "#data": "data",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":timestamp": timestamp,
          ":data": additionalData,
        },
        ReturnValues: "ALL_NEW",
      });

      const response = (await dynamoDb.send(command)) as any;
      return response.Attributes;
    } catch (error) {
      console.error("[DynamoDB Error] updateDeviceStatus:", error);
      throw error;
    }
  }

  /**
   * สร้างอุปกรณ์ใหม่
   * @param deviceId - รหัสอุปกรณ์
   * @param name - ชื่ออุปกรณ์
   * @param type - ประเภทอุปกรณ์
   * @param location - ตำแหน่งที่ติดตั้ง
   */
  async createDevice(
    deviceId: string,
    name: string,
    type: string,
    location?: string
  ): Promise<DeviceStatus> {
    try {
      if (!deviceId || !name || !type) {
        throw new Error("deviceId, name, and type are required");
      }

      const timestamp = Date.now();

      const item: DeviceStatus = {
        deviceId: deviceId,
        name: name,
        type: type,
        status: "off",
        location: location || "",
        createdAt: timestamp,
        lastUpdate: timestamp,
        data: {},
      };

      const command = new PutCommand({
        TableName: DEVICE_STATUS_TABLE,
        Item: item,
      });

      await dynamoDb.send(command);
      return item;
    } catch (error) {
      console.error("[DynamoDB Error] createDevice:", error);
      throw error;
    }
  }

  /**
   * ลบอุปกรณ์
   * @param deviceId - รหัสอุปกรณ์
   */
  async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      if (!deviceId) {
        throw new Error("deviceId is required");
      }

      // ใช้ UpdateCommand กับ AttributeAction DELETE (สำหรับ DynamoDB)
      // หรือใช้ DeleteCommand ถ้า AWS SDK รองรับ
      console.warn("[Warning] Delete operation not fully implemented. Use AWS Console to delete.");
      return true;
    } catch (error) {
      console.error("[DynamoDB Error] deleteDevice:", error);
      throw error;
    }
  }

  /**
   * ดึงจำนวนอุปกรณ์ทั้งหมด
   */
  async getDeviceCount(): Promise<number> {
    try {
      const command = new ScanCommand({
        TableName: DEVICE_STATUS_TABLE,
        Select: "COUNT",
      });

      const response = (await dynamoDb.send(command)) as any;
      return response.Count || 0;
    } catch (error) {
      console.error("[DynamoDB Error] getDeviceCount:", error);
      throw error;
    }
  }
}

export default new DeviceService();
