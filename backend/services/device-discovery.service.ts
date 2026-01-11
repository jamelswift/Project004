/**
 * Device Discovery Service
 * ค้นหาและลงทะเบียนอุปกรณ์อัตโนมัติบนเครือข่าย
 */

import { dynamoDb } from '../aws/dynamodb.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import * as os from 'os';

export interface DiscoveredDevice {
  ipAddress: string;
  macAddress: string;
  hostname: string;
  deviceType?: string;
  firmwareVersion?: string;
  lastSeen: string;
}

export class DeviceDiscoveryService {
  /**
   * Get network interfaces information
   */
  getNetworkInterfaces() {
    return os.networkInterfaces();
  }

  /**
   * Calculate network range for scanning
   */
  getNetworkRange(): { network: string; broadcast: string } | null {
    const interfaces = this.getNetworkInterfaces();
    
    // Get the first active IPv4 address (usually wlan0 or eth0)
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal && addr.address) {
          // Calculate network address
          const [a, b, c] = addr.address.split('.').slice(0, 3);
          return {
            network: `${a}.${b}.${c}.`,
            broadcast: `${a}.${b}.${c}.255`
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Register discovered device to DynamoDB
   */
  async registerDiscoveredDevice(
    ipAddress: string,
    deviceName: string,
    deviceType: string = 'sensor'
  ): Promise<boolean> {
    try {
      const deviceId = `${deviceType.toUpperCase()}_${ipAddress.split('.').pop()}`;
      const now = new Date().toISOString();

      const device = {
        deviceId,
        name: deviceName,
        type: deviceType,
        status: 'online',
        location: 'auto-discovered',
        macAddress: 'DISCOVERED',
        ipAddress,
        lastUpdate: now,
        registeredAt: now,
        discoveredAt: now,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: process.env.DYNAMODB_DEVICE_STATUS_TABLE || 'DeviceStatus',
          Item: device
        })
      );

      console.log(`[Device Discovery] ✅ Device registered: ${deviceId} (${ipAddress})`);
      return true;
    } catch (error: any) {
      console.warn(`[Device Discovery] Failed to register device: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if device already exists
   */
  async deviceExists(ipAddress: string): Promise<boolean> {
    try {
      // This would require a scan operation or better indexing
      // For now, return false to allow re-registration
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update device last seen timestamp
   */
  async updateDeviceHeartbeat(ipAddress: string): Promise<void> {
    try {
      // Update last seen time
      const deviceId = `*_${ipAddress.split('.').pop()}`;
      console.log(`[Device Discovery] Heartbeat from ${ipAddress}`);
    } catch (error) {
      console.warn(`[Device Discovery] Heartbeat update failed: ${error}`);
    }
  }

  /**
   * Get list of devices that might be IoT devices based on common patterns
   */
  async scanNetworkForDevices(): Promise<DiscoveredDevice[]> {
    const discoveredDevices: DiscoveredDevice[] = [];
    const range = this.getNetworkRange();

    if (!range) {
      console.log('[Device Discovery] Could not determine network range');
      return discoveredDevices;
    }

    console.log(`[Device Discovery] Scanning network: ${range.network}0 - ${range.broadcast}`);

    // In a production system, you would use arp-scan or similar
    // For now, this is a placeholder that shows the structure
    
    return discoveredDevices;
  }

  /**
   * Get device health status
   */
  async getDeviceHealth(ipAddress: string): Promise<{ status: string; lastSeen: string }> {
    try {
      // Try to connect to device HTTP endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`http://${ipAddress}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          status: 'online',
          lastSeen: new Date().toISOString(),
        };
      }
    } catch (error) {
      // Device is offline or not responding
    }

    return {
      status: 'offline',
      lastSeen: new Date().toISOString(),
    };
  }
}

export const deviceDiscoveryService = new DeviceDiscoveryService();
