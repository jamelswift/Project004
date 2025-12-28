/**
 * AWS IoT Core Service
 * จัดการการเชื่อมต่อและสื่อสารกับ AWS IoT Core
 */

import { IoTClient, AttachPolicyCommand, CreateKeysAndCertificateCommand, DescribeThingCommand } from '@aws-sdk/client-iot';
import { IoTDataPlaneClient, PublishCommand, GetThingShadowCommand, UpdateThingShadowCommand } from '@aws-sdk/client-iot-data-plane';
import dotenv from 'dotenv';

dotenv.config();

// IoT Client Configuration
const iotRegion = process.env.AWS_IOT_REGION || process.env.AWS_REGION || 'ap-southeast-1';

const iotClient = new IoTClient({
  region: iotRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// IoT Data Plane Client (for publishing messages and shadows)
const iotDataClient = new IoTDataPlaneClient({
  region: iotRegion,
  endpoint: `https://${process.env.AWS_IOT_ENDPOINT}`, // e.g., https://xxxxx-ats.iot.ap-southeast-1.amazonaws.com
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Publish message to IoT Topic
 * @param topic - MQTT topic name
 * @param payload - Message payload
 */
export async function publishToTopic(topic: string, payload: any) {
  try {
    const command = new PublishCommand({
      topic,
      payload: JSON.stringify(payload),
      qos: 1, // Quality of Service
    });

    const response = await iotDataClient.send(command);
    console.log(`[IoT] Published to topic: ${topic}`, response);
    return { success: true, response };
  } catch (error) {
    console.error(`[IoT Error] Failed to publish to ${topic}:`, error);
    throw error;
  }
}

/**
 * Get Thing Shadow (Device State)
 * @param thingName - IoT Thing name
 */
export async function getThingShadow(thingName: string) {
  try {
    const command = new GetThingShadowCommand({
      thingName,
    });

    const response = await iotDataClient.send(command);
    const shadow = JSON.parse(new TextDecoder().decode(response.payload));
    console.log(`[IoT] Retrieved shadow for: ${thingName}`);
    return { success: true, shadow };
  } catch (error) {
    console.error(`[IoT Error] Failed to get shadow for ${thingName}:`, error);
    throw error;
  }
}

/**
 * Update Thing Shadow (Device State)
 * @param thingName - IoT Thing name
 * @param state - Desired state
 */
export async function updateThingShadow(thingName: string, state: any) {
  try {
    const payload = {
      state: {
        desired: state,
      },
    };

    const command = new UpdateThingShadowCommand({
      thingName,
      payload: JSON.stringify(payload),
    });

    const response = await iotDataClient.send(command);
    console.log(`[IoT] Updated shadow for: ${thingName}`);
    return { success: true, response };
  } catch (error) {
    console.error(`[IoT Error] Failed to update shadow for ${thingName}:`, error);
    throw error;
  }
}

/**
 * Create IoT Thing Certificates
 * @param setAsActive - Set certificate as active
 */
export async function createThingCertificate(setAsActive = true) {
  try {
    const command = new CreateKeysAndCertificateCommand({
      setAsActive,
    });

    const response = await iotClient.send(command);
    console.log('[IoT] Created new certificate:', response.certificateId);
    
    return {
      success: true,
      certificateArn: response.certificateArn,
      certificateId: response.certificateId,
      certificatePem: response.certificatePem,
      keyPair: response.keyPair,
    };
  } catch (error) {
    console.error('[IoT Error] Failed to create certificate:', error);
    throw error;
  }
}

/**
 * Subscribe to IoT Topic (for backend to listen)
 * Note: For real-time subscriptions, use AWS IoT SDK with MQTT
 */
export async function subscribeToTopic(topic: string, callback: (message: any) => void) {
  console.log(`[IoT] Subscribing to topic: ${topic}`);
  // Implementation depends on MQTT client library
  // This is a placeholder for MQTT subscription logic
}

// Export clients for advanced usage
export { iotClient, iotDataClient };
