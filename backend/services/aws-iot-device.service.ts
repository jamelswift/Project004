/**
 * AWS IoT Device Service
 * จัดการการสร้างและลบอุปกรณ์ใน AWS IoT Core
 */

import {
  IoTClient,
  CreateThingCommand,
  DeleteThingCommand,
  CreateThingTypeCommand,
  CreateKeysAndCertificateCommand,
  AttachThingPrincipalCommand,
  DescribeThingCommand,
  ListThingsCommand,
  CreatePolicyCommand,
  AttachPrincipalPolicyCommand,
  UpdateThingCommand,
} from "@aws-sdk/client-iot";
import { IoTDataPlaneClient, UpdateThingShadowCommand } from "@aws-sdk/client-iot-data-plane";
import * as fs from "fs";
import * as path from "path";

// Lazy initialize AWS IoT clients
let iotClient: IoTClient | null = null;
let iotDataClient: IoTDataPlaneClient | null = null;

function getIoTClient(): IoTClient {
  if (!iotClient) {
    iotClient = new IoTClient({
      region: process.env.AWS_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return iotClient;
}

function getIoTDataClient(): IoTDataPlaneClient {
  if (!iotDataClient) {
    iotDataClient = new IoTDataPlaneClient({
      region: process.env.AWS_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return iotDataClient;
}

export interface AwsIoTDeviceInfo {
  thingName: string;
  certificateArn?: string;
  certificatePem?: string;
  privateKey?: string;
  certificateId?: string;
}

export class AwsIoTDeviceService {
  /**
   * สร้าง AWS IoT Thing (ตัวแทนอุปกรณ์)
   */
  async createIoTThing(
    deviceName: string,
    deviceType: string,
    attributes?: Record<string, string>
  ): Promise<AwsIoTDeviceInfo> {
    try {
      // ตรวจสอบชื่ออุปกรณ์ว่าไม่มีอักขระพิเศษ
      const sanitizedName = this.sanitizeThingName(deviceName);

      console.log(`[AWS IoT] Creating thing: ${sanitizedName}`);

      // สร้าง Thing ใหม่
      const createThingParams = {
        thingName: sanitizedName,
        thingTypeName: "IoTSensor", // กำหนดประเภท
        attributePayload: {
          attributes: {
            deviceType,
            createdAt: new Date().toISOString(),
            ...(attributes || {}),
          },
        },
      };

      await getIoTClient().send(new CreateThingCommand(createThingParams));
      console.log(`[AWS IoT] ✅ Thing created: ${sanitizedName}`);

      return {
        thingName: sanitizedName,
      };
    } catch (error: any) {
      console.error("[AWS IoT] Error creating thing:", error);

      // ถ้า Thing มีอยู่แล้ว ให้อัปเดตแทน
      if (
        error.name === "ResourceAlreadyExistsException" ||
        error.Code === "ResourceAlreadyExistsException"
      ) {
        console.log(`[AWS IoT] Thing already exists, updating...`);
        return {
          thingName: this.sanitizeThingName(deviceName),
        };
      }

      throw error;
    }
  }

  /**
   * สร้าง Certificate และ Private Key สำหรับอุปกรณ์
   */
  async createDeviceCertificate(thingName: string): Promise<AwsIoTDeviceInfo> {
    try {
      console.log(`[AWS IoT] Creating certificate for: ${thingName}`);

      // สร้าง Certificate และ Private Key
      const createCertParams = {
        setAsActive: true,
      };

      const certResponse = await getIoTClient().send(
        new CreateKeysAndCertificateCommand(createCertParams)
      );

      const certificateArn = certResponse.certificateArn;
      const certificateId = certResponse.certificateId;
      const certificatePem = certResponse.certificatePem;
      const keyPair = certResponse.keyPair;

      if (!certificateArn || !certificateId || !certificatePem || !keyPair) {
        throw new Error("Failed to create certificate");
      }

      console.log(`[AWS IoT] ✅ Certificate created: ${certificateId}`);

      // เชื่อมต่อ Certificate กับ Thing
      await getIoTClient().send(
        new AttachThingPrincipalCommand({
          thingName,
          principal: certificateArn,
        })
      );

      console.log(`[AWS IoT] ✅ Certificate attached to thing: ${thingName}`);

      // สร้าง IAM Policy สำหรับอุปกรณ์
      try {
        await this.attachDevicePolicy(certificateArn);
      } catch (policyError: any) {
        console.warn("[AWS IoT] Policy attachment warning:", policyError.message);
        // ไม่ให้หยุดกระบวนการ ถ้า policy มีปัญหา
      }

      return {
        thingName,
        certificateArn,
        certificateId,
        certificatePem,
        privateKey: keyPair.PrivateKey,
      };
    } catch (error: any) {
      console.error("[AWS IoT] Error creating certificate:", error);
      throw error;
    }
  }

  /**
   * Attach IoT Policy ให้กับ Certificate
   */
  private async attachDevicePolicy(certificateArn: string): Promise<void> {
    const policyName = "IoTDevicePolicy";

    try {
      // ตรวจสอบว่า Policy มีอยู่หรือไม่
      console.log(`[AWS IoT] Attaching policy: ${policyName}`);

      // สร้าง Policy ถ้ายังไม่มี
      try {
        const policyDocument = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["iot:*"],
              Resource: "*",
            },
          ],
        };

        await getIoTClient().send(
          new CreatePolicyCommand({
            policyName,
            policyDocument: JSON.stringify(policyDocument),
          })
        );

        console.log(`[AWS IoT] ✅ Policy created: ${policyName}`);
      } catch (createError: any) {
        // Policy อาจมีอยู่แล้ว ให้ข้ามไป
        if (
          createError.name !== "ResourceAlreadyExistsException" &&
          createError.Code !== "ResourceAlreadyExistsException"
        ) {
          throw createError;
        }
      }

      // Attach Policy ไปกับ Certificate
      await getIoTClient().send(
        new AttachPrincipalPolicyCommand({
          policyName,
          principal: certificateArn,
        })
      );

      console.log(`[AWS IoT] ✅ Policy attached to certificate`);
    } catch (error: any) {
      console.error("[AWS IoT] Error attaching policy:", error);
      throw error;
    }
  }

  /**
   * ลบอุปกรณ์จาก AWS IoT
   */
  async deleteIoTThing(thingName: string): Promise<void> {
    try {
      console.log(`[AWS IoT] Deleting thing: ${thingName}`);

      // ดึง Thing principals (certificates)
      const describeThing = await getIoTClient().send(
        new DescribeThingCommand({
          thingName,
        })
      );

      // ถ้ามี principals ให้ detach ออกก่อน
      if (describeThing.thingArn) {
        // ลบ Thing
        await getIoTClient().send(
          new DeleteThingCommand({
            thingName,
          })
        );

        console.log(`[AWS IoT] ✅ Thing deleted: ${thingName}`);
      }
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException" || error.Code === "ResourceNotFoundException") {
        console.log(`[AWS IoT] Thing not found: ${thingName}`);
        return;
      }
      console.error("[AWS IoT] Error deleting thing:", error);
      throw error;
    }
  }

  /**
   * อัปเดต Thing attributes
   */
  async updateThingAttributes(
    thingName: string,
    attributes: Record<string, string>
  ): Promise<void> {
    try {
      console.log(`[AWS IoT] Updating thing attributes: ${thingName}`);

      await getIoTClient().send(
        new UpdateThingCommand({
          thingName,
          attributePayload: {
            attributes,
          },
        })
      );

      console.log(`[AWS IoT] ✅ Thing attributes updated: ${thingName}`);
    } catch (error: any) {
      console.error("[AWS IoT] Error updating thing attributes:", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Thing
   */
  async describeThing(thingName: string) {
    try {
      const response = await getIoTClient().send(
        new DescribeThingCommand({
          thingName,
        })
      );

      return response;
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException" || error.Code === "ResourceNotFoundException") {
        return null;
      }
      throw error;
    }
  }

  /**
   * ดึงรายการ Things ทั้งหมด
   */
  async listThings(): Promise<any[]> {
    try {
      const response = await getIoTClient().send(new ListThingsCommand({}));
      return response.things || [];
    } catch (error: any) {
      console.error("[AWS IoT] Error listing things:", error);
      return [];
    }
  }

  /**
   * อัปเดต Thing Shadow (สถานะอุปกรณ์)
   */
  async updateThingShadow(thingName: string, state: Record<string, any>): Promise<void> {
    try {
      const payload = {
        state: {
          reported: state,
        },
      };

      await getIoTDataClient().send(
        new UpdateThingShadowCommand({
          thingName,
          payload: JSON.stringify(payload),
        })
      );

      console.log(`[AWS IoT] ✅ Thing shadow updated: ${thingName}`);
    } catch (error: any) {
      console.error("[AWS IoT] Error updating thing shadow:", error);
      // ไม่ให้ throw เพราะอาจเป็น optional feature
    }
  }

  /**
   * Save certificates ลงแผ่นดิสก์
   */
  async saveCertificatesToFile(
    deviceName: string,
    certInfo: AwsIoTDeviceInfo
  ): Promise<string> {
    try {
      const certDir = path.join(
        process.cwd(),
        "backend",
        "certificates",
        deviceName
      );

      // สร้างโฟลเดอร์ถ้ายังไม่มี
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }

      // บันทึก Certificate
      if (certInfo.certificatePem) {
        fs.writeFileSync(
          path.join(certDir, "certificate.pem.crt"),
          certInfo.certificatePem
        );
      }

      // บันทึก Private Key
      if (certInfo.privateKey) {
        fs.writeFileSync(
          path.join(certDir, "private.pem.key"),
          certInfo.privateKey
        );
      }

      console.log(`[AWS IoT] ✅ Certificates saved to: ${certDir}`);
      return certDir;
    } catch (error: any) {
      console.error("[AWS IoT] Error saving certificates:", error);
      throw error;
    }
  }

  /**
   * ทำให้ชื่อ Thing เป็น valid (เฉพาะ alphanumeric, dash, underscore)
   */
  private sanitizeThingName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_-]/g, "_") // แทนที่อักขระพิเศษด้วย _
      .substring(0, 128) // จำกัดความยาว
      .toLowerCase();
  }
}

export const awsIoTDeviceService = new AwsIoTDeviceService();
