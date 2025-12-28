import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const DEVICE_ACCESS_TABLE = process.env.DYNAMODB_DEVICE_ACCESS_TABLE || 'DeviceAccess';
const DEVICE_STATUS_TABLE = process.env.DYNAMODB_DEVICE_STATUS_TABLE || 'DeviceStatus';

export type DeviceRole = 'owner' | 'admin' | 'user' | 'viewer';
export type Permission = 'read' | 'write' | 'control' | 'share' | 'delete';

export interface DeviceAccess {
  accessId: string; // userId#deviceId
  userId: string;
  deviceId: string;
  deviceName: string;
  role: DeviceRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  sharedBy?: string; // userId of person who shared
}

export interface DeviceWithAccess {
  deviceId: string;
  deviceName: string;
  thingName: string;
  deviceType: string;
  status: string;
  lastSeen?: string;
  role: DeviceRole;
  permissions: Permission[];
  isOwner: boolean;
}

const ROLE_PERMISSIONS: Record<DeviceRole, Permission[]> = {
  owner: ['read', 'write', 'control', 'share', 'delete'],
  admin: ['read', 'write', 'control', 'share'],
  user: ['read', 'control'],
  viewer: ['read']
};

export class DeviceAccessService {
  /**
   * Grant access to a device for a user
   */
  static async grantAccess(
    userId: string,
    deviceId: string,
    deviceName: string,
    role: DeviceRole = 'user',
    sharedBy?: string
  ): Promise<DeviceAccess> {
    const accessId = `${userId}#${deviceId}`;
    const permissions = ROLE_PERMISSIONS[role];

    const access: DeviceAccess = {
      accessId,
      userId,
      deviceId,
      deviceName,
      role,
      permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(sharedBy && { sharedBy })
    };

    await docClient.send(new PutCommand({
      TableName: DEVICE_ACCESS_TABLE,
      Item: access
    }));

    return access;
  }

  /**
   * Get all devices accessible by a user
   */
  static async getUserDevices(userId: string): Promise<DeviceWithAccess[]> {
    // Query by userId using GSI
    const result = await docClient.send(new QueryCommand({
      TableName: DEVICE_ACCESS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Fetch device details for each access record
    const devices: DeviceWithAccess[] = [];
    
    for (const access of result.Items as DeviceAccess[]) {
      try {
        // Get device details from DeviceStatus table
        const deviceResult = await docClient.send(new GetCommand({
          TableName: DEVICE_STATUS_TABLE,
          Key: { deviceId: access.deviceId }
        }));

        if (deviceResult.Item) {
          devices.push({
            deviceId: access.deviceId,
            deviceName: deviceResult.Item.deviceName || access.deviceName,
            thingName: deviceResult.Item.thingName || access.deviceId,
            deviceType: deviceResult.Item.deviceType || 'relay',
            status: deviceResult.Item.status || 'unknown',
            lastSeen: deviceResult.Item.lastSeen,
            role: access.role,
            permissions: access.permissions,
            isOwner: access.role === 'owner'
          });
        }
      } catch (error) {
        console.error(`Error fetching device ${access.deviceId}:`, error);
      }
    }

    return devices;
  }

  /**
   * Check if user has access to a device
   */
  static async hasAccess(userId: string, deviceId: string): Promise<boolean> {
    const accessId = `${userId}#${deviceId}`;

    try {
      const result = await docClient.send(new GetCommand({
        TableName: DEVICE_ACCESS_TABLE,
        Key: { accessId, createdAt: await this.getCreatedAt(accessId) }
      }));

      return !!result.Item;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user has specific permission for a device
   */
  static async hasPermission(
    userId: string,
    deviceId: string,
    permission: Permission
  ): Promise<boolean> {
    const accessId = `${userId}#${deviceId}`;

    try {
      const createdAt = await this.getCreatedAt(accessId);
      if (!createdAt) return false;

      const result = await docClient.send(new GetCommand({
        TableName: DEVICE_ACCESS_TABLE,
        Key: { accessId, createdAt }
      }));

      if (!result.Item) return false;

      const access = result.Item as DeviceAccess;
      return access.permissions.includes(permission);
    } catch (error) {
      return false;
    }
  }

  /**
   * Share device with another user
   */
  static async shareDevice(
    ownerId: string,
    deviceId: string,
    targetUserId: string,
    role: DeviceRole = 'user'
  ): Promise<DeviceAccess> {
    // Check if owner has share permission
    const canShare = await this.hasPermission(ownerId, deviceId, 'share');
    if (!canShare) {
      throw new Error('You do not have permission to share this device');
    }

    // Get device name
    const deviceResult = await docClient.send(new GetCommand({
      TableName: DEVICE_STATUS_TABLE,
      Key: { deviceId }
    }));

    const deviceName = deviceResult.Item?.deviceName || deviceId;

    // Grant access to target user
    return await this.grantAccess(targetUserId, deviceId, deviceName, role, ownerId);
  }

  /**
   * Revoke access from a user
   */
  static async revokeAccess(userId: string, deviceId: string): Promise<void> {
    const accessId = `${userId}#${deviceId}`;
    const createdAt = await this.getCreatedAt(accessId);

    if (!createdAt) {
      throw new Error('Access record not found');
    }

    await docClient.send(new DeleteCommand({
      TableName: DEVICE_ACCESS_TABLE,
      Key: { accessId, createdAt }
    }));
  }

  /**
   * Get all users who have access to a device
   */
  static async getDeviceUsers(deviceId: string): Promise<DeviceAccess[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: DEVICE_ACCESS_TABLE,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId
      }
    }));

    return (result.Items || []) as DeviceAccess[];
  }

  /**
   * Update user role for a device
   */
  static async updateRole(
    userId: string,
    deviceId: string,
    newRole: DeviceRole
  ): Promise<void> {
    const accessId = `${userId}#${deviceId}`;
    const createdAt = await this.getCreatedAt(accessId);

    if (!createdAt) {
      throw new Error('Access record not found');
    }

    const permissions = ROLE_PERMISSIONS[newRole];

    await docClient.send(new UpdateCommand({
      TableName: DEVICE_ACCESS_TABLE,
      Key: { accessId, createdAt },
      UpdateExpression: 'SET #role = :role, #permissions = :permissions, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#role': 'role',
        '#permissions': 'permissions',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':role': newRole,
        ':permissions': permissions,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }

  /**
   * Helper: Get createdAt for an accessId (needed for composite key queries)
   */
  private static async getCreatedAt(accessId: string): Promise<string | null> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: DEVICE_ACCESS_TABLE,
        KeyConditionExpression: 'accessId = :accessId',
        ExpressionAttributeValues: {
          ':accessId': accessId
        },
        Limit: 1
      }));

      return result.Items?.[0]?.createdAt || null;
    } catch (error) {
      return null;
    }
  }
}
