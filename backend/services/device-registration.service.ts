/**
 * Device Registration Service
 * จัดการการลงทะเบียนและจัดการอุปกรณ์
 */

import {
  QueryCommand,
  ScanCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoDb } from "../aws/dynamodb.js";
import { thresholdService } from "./threshold.service.js";
import { DeviceAccessService } from "./device-access.service.js";

const DEVICES_TABLE = process.env.DYNAMODB_DEVICE_STATUS_TABLE || "DeviceStatus";

export interface Device {
  deviceId: string;
  name: string;
  type: "light" | "sensor" | "actuator";
  status: "online" | "offline";
  macAddress?: string;
  ipAddress?: string;
  lastUpdate: string;
  registeredAt: string;
  firmwareVersion?: string;
}

export class DeviceRegistrationService {
  /**
   * สร้าง Device ใหม่จากการเชื่อมต่อ
   */
  async registerDevice(
    hardwareInfo: {
      macAddress: string;
      ipAddress: string;
      type?: string;
      firmwareVersion?: string;
    },
    userId?: string // เพิ่ม userId เพื่อกำหนด owner
  ): Promise<Device> {
    // ตรวจสอบว่า device นี้มีอยู่แล้วหรือไม่
    const existingDevice = await this.getDeviceByMacAddress(hardwareInfo.macAddress);
    if (existingDevice) {
      // อัปเดต last update แล้วคืนข้อมูล device ที่แน่นอน
      await this.updateDeviceLastSeen(existingDevice.deviceId);
      return {
        ...existingDevice,
        status: "online",
        lastUpdate: new Date().toISOString(),
      };
    }

    // Auto-generate device name ตามประเภท
    const deviceType = this.detectDeviceType(hardwareInfo.type);
    const deviceName = await this.generateDeviceName(deviceType);
    const deviceId = `${deviceType.toUpperCase()}_${hardwareInfo.macAddress.slice(-4).toUpperCase()}`;

    const now = new Date().toISOString();
    const device: Device = {
      deviceId,
      name: deviceName,
      type: deviceType,
      status: "online",
      macAddress: hardwareInfo.macAddress,
      ipAddress: hardwareInfo.ipAddress,
      lastUpdate: now,
      registeredAt: now,
      firmwareVersion: hardwareInfo.firmwareVersion,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: DEVICES_TABLE,
        Item: device,
      })
    );

    // Grant owner access to the user who registered this device
    if (userId) {
      await DeviceAccessService.grantAccess(
        userId,
        deviceId,
        deviceName,
        'owner'
      );
    }

    // สร้างการแจ้งเตือนเมื่อมีการลงทะเบียนอุปกรณ์ใหม่
    await thresholdService.createNotification({
      deviceId,
      sensorType: "system",
      currentValue: null,
      thresholdValue: null,
      thresholdType: null,
      message: `อุปกรณ์ ${deviceName} (${deviceId}) ลงทะเบียนแล้ว`,
      severity: "info",
    });

    return device;
  }

  /**
   * ตรวจสอบประเภท device จากข้อมูลที่ส่งมา
   */
  private detectDeviceType(
    typeHint?: string
  ): "light" | "sensor" | "actuator" {
    if (!typeHint) return "sensor";

    const type = typeHint.toLowerCase();
    if (type.includes("light") || type.includes("relay")) return "light";
    if (type.includes("sensor")) return "sensor";
    if (type.includes("actuator")) return "actuator";

    return "sensor";
  }

  /**
   * Generate ชื่อ device อัตโนมัติ
   */
  private async generateDeviceName(type: string): Promise<string> {
    const devices = await this.getAllDevices();
    const sameTypeDevices = devices.filter((d) => d.type === type);
    const count = sameTypeDevices.length + 1;

    const typeNames: Record<string, string> = {
      light: "หลอดไฟ",
      sensor: "เซ็นเซอร์",
      actuator: "ตัวควบคุม",
    };

    return `${typeNames[type] || type} #${count}`;
  }

  /**
   * ค้นหา device จาก MAC Address
   */
  private async getDeviceByMacAddress(macAddress: string): Promise<Device | null> {
    try {
      const command = new ScanCommand({
        TableName: DEVICES_TABLE,
        FilterExpression: "macAddress = :mac",
        ExpressionAttributeValues: {
          ":mac": macAddress,
        },
      });

      const response = await dynamoDb.send(command);
      return (response.Items?.[0] as Device) || null;
    } catch (error) {
      console.error("Error finding device by MAC:", error);
      return null;
    }
  }

  /**
   * ดึง Device ทั้งหมด
   */
  async getAllDevices(): Promise<Device[]> {
    try {
      const command = new ScanCommand({
        TableName: DEVICES_TABLE,
      });

      const response = await dynamoDb.send(command);
      return (response.Items as Device[]) || [];
    } catch (error) {
      console.error("Error getting all devices:", error);
      return [];
    }
  }

  /**
   * ดึง Device ตาม ID
   */
  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      const command = new GetItemCommand({
        TableName: DEVICES_TABLE,
        Key: { deviceId: { S: deviceId } },
      });

      const response = await dynamoDb.send(command);
      if (!response.Item) return null;

      // Convert DynamoDB format to Device
      const item = response.Item as any;
      return {
        deviceId: item.deviceId.S,
        name: item.name.S,
        type: item.type.S,
        status: item.status.S,
        macAddress: item.macAddress?.S,
        ipAddress: item.ipAddress?.S,
        lastUpdate: item.lastUpdate.S,
        registeredAt: item.registeredAt.S,
        firmwareVersion: item.firmwareVersion?.S,
      };
    } catch (error) {
      console.error("Error getting device:", error);
      return null;
    }
  }

  /**
   * อัปเดตชื่อ device
   */
  async updateDeviceName(deviceId: string, name: string): Promise<Device | null> {
    try {
      const command = new UpdateItemCommand({
        TableName: DEVICES_TABLE,
        Key: { deviceId: { S: deviceId } },
        UpdateExpression: "SET #name = :name, #lastUpdate = :lastUpdate",
        ExpressionAttributeNames: {
          "#name": "name",
          "#lastUpdate": "lastUpdate",
        },
        ExpressionAttributeValues: {
          ":name": { S: name },
          ":lastUpdate": { S: new Date().toISOString() },
        },
        ReturnValues: "ALL_NEW",
      });

      const response = await dynamoDb.send(command);
      if (!response.Attributes) return null;

      const item = response.Attributes as any;
      return {
        deviceId: item.deviceId.S,
        name: item.name.S,
        type: item.type.S,
        status: item.status.S,
        macAddress: item.macAddress?.S,
        ipAddress: item.ipAddress?.S,
        lastUpdate: item.lastUpdate.S,
        registeredAt: item.registeredAt.S,
      };
    } catch (error) {
      console.error("Error updating device name:", error);
      return null;
    }
  }

  /**
   * อัปเดตประเภท device
   */
  async updateDeviceType(
    deviceId: string,
    type: "light" | "sensor" | "actuator"
  ): Promise<Device | null> {
    try {
      const command = new UpdateItemCommand({
        TableName: DEVICES_TABLE,
        Key: { deviceId: { S: deviceId } },
        UpdateExpression: "SET #type = :type, #lastUpdate = :lastUpdate",
        ExpressionAttributeNames: {
          "#type": "type",
          "#lastUpdate": "lastUpdate",
        },
        ExpressionAttributeValues: {
          ":type": { S: type },
          ":lastUpdate": { S: new Date().toISOString() },
        },
        ReturnValues: "ALL_NEW",
      });

      const response = await dynamoDb.send(command);
      if (!response.Attributes) return null;

      const item = response.Attributes as any;
      return {
        deviceId: item.deviceId.S,
        name: item.name.S,
        type: item.type.S,
        status: item.status.S,
        macAddress: item.macAddress?.S,
        ipAddress: item.ipAddress?.S,
        lastUpdate: item.lastUpdate.S,
        registeredAt: item.registeredAt.S,
      };
    } catch (error) {
      console.error("Error updating device type:", error);
      return null;
    }
  }

  /**
   * อัปเดตสถานะ device (online/offline)
   */
  async updateDeviceStatus(
    deviceId: string,
    status: "online" | "offline"
  ): Promise<void> {
    try {
      const command = new UpdateItemCommand({
        TableName: DEVICES_TABLE,
        Key: { deviceId: { S: deviceId } },
        UpdateExpression: "SET #status = :status, #lastUpdate = :lastUpdate",
        ExpressionAttributeNames: {
          "#status": "status",
          "#lastUpdate": "lastUpdate",
        },
        ExpressionAttributeValues: {
          ":status": { S: status },
          ":lastUpdate": { S: new Date().toISOString() },
        },
      });

      await dynamoDb.send(command);
    } catch (error) {
      console.error("Error updating device status:", error);
    }
  }

  /**
   * อัปเดต last seen time
   */
  private async updateDeviceLastSeen(deviceId: string): Promise<Device | null> {
    try {
      const command = new UpdateItemCommand({
        TableName: DEVICES_TABLE,
        Key: { deviceId: { S: deviceId } },
        UpdateExpression:
          "SET #lastUpdate = :lastUpdate, #status = :status",
        ExpressionAttributeNames: {
          "#lastUpdate": "lastUpdate",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":lastUpdate": { S: new Date().toISOString() },
          ":status": { S: "online" },
        },
        ReturnValues: "ALL_NEW",
      });

      const response = await dynamoDb.send(command);
      if (!response.Attributes) return null;

      const item = response.Attributes as any;
      return {
        deviceId: item.deviceId.S,
        name: item.name.S,
        type: item.type.S,
        status: item.status.S,
        macAddress: item.macAddress?.S,
        ipAddress: item.ipAddress?.S,
        lastUpdate: item.lastUpdate.S,
        registeredAt: item.registeredAt.S,
      };
    } catch (error) {
      console.error("Error updating device last seen:", error);
      return null;
    }
  }

  /**
   * ลบ device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const command = new DeleteItemCommand({
        TableName: DEVICES_TABLE,
        Key: { deviceId: { S: deviceId } },
      });

      await dynamoDb.send(command);
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  }
}

export const deviceRegistrationService = new DeviceRegistrationService();
