import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
  }
});

export interface WelcomeEmailData {
  email: string;
  name: string;
  userId: string;
}

export interface ResetEmailData {
  email: string;
  name?: string;
  userId: string;
  token: string;
}

// Send welcome email after registration
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"WSN IoT Platform" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: 'ยินดีต้อนรับสู่ WSN IoT Management Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ยินดีต้อนรับ!</h1>
            </div>
            <div class="content">
              <h2>สวัสดี ${data.name || 'ผู้ใช้งานใหม่'}!</h2>
              <p>ขอบคุณที่สมัครใช้งาน <strong>WSN IoT Management Platform</strong></p>
              
              <h3>ข้อมูลบัญชีของคุณ:</h3>
              <ul>
                <li><strong>อีเมล:</strong> ${data.email}</li>
                <li><strong>User ID:</strong> ${data.userId}</li>
                <li><strong>สร้างเมื่อ:</strong> ${new Date().toLocaleString('th-TH')}</li>
              </ul>
              
              <h3>คุณสามารถเข้าใช้งานได้เลย:</h3>
              <ul>
                <li>✅ ควบคุมอุปกรณ์ IoT แบบเรียลไทม์</li>
                <li>✅ ตรวจสอบข้อมูลเซ็นเซอร์</li>
                <li>✅ ตั้งเวลาเปิด-ปิดอุปกรณ์</li>
                <li>✅ เชื่อมต่อ AWS IoT Core</li>
                <li>✅ รับการแจ้งเตือนผ่านอีเมล</li>
              </ul>
              
              <p><strong>หมายเหตุ:</strong> กรุณาเก็บรักษาข้อมูลบัญชีของคุณให้ปลอดภัย</p>
              
              <p>หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมงานของเรา</p>
              
              <p>ขอบคุณที่ไว้วางใจใช้บริการของเรา</p>
              <p>ทีมงาน WSN IoT Platform</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WSN IoT Management Platform. All rights reserved.</p>
              <p>Email นี้ถูกส่งแบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // If EMAIL_USER is not configured, just log and return true (dev mode)
    if (!process.env.EMAIL_USER) {
      console.log('📧 [Email Service - Dev Mode] Welcome email would be sent to:', data.email);
      console.log('   User:', data.name);
      console.log('   UserID:', data.userId);
      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully to:', data.email);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error - email failure shouldn't block registration
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(data: ResetEmailData): Promise<boolean> {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${data.token}&userId=${data.userId}`;

    const mailOptions = {
      from: `"WSN IoT Platform" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: 'รีเซ็ตรหัสผ่านสำหรับ WSN IoT Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); color: white; padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 28px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .muted { color: #6b7280; font-size: 13px; }
            .footer { text-align: center; margin-top: 24px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>รีเซ็ตรหัสผ่าน</h1>
            </div>
            <div class="content">
              <p>สวัสดี ${data.name || 'ผู้ใช้งาน'},</p>
              <p>คุณได้รับอีเมลนี้เนื่องจากมีการขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
              <p>กดปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
              <p style="text-align:center; margin: 24px 0;">
                <a class="button" href="${resetLink}">รีเซ็ตรหัสผ่าน</a>
              </p>
              <p class="muted">ลิงก์นี้จะหมดอายุภายใน 15 นาที หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉย</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WSN IoT Management Platform</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    if (!process.env.EMAIL_USER) {
      console.log('📧 [Email Service - Dev Mode] Password reset email would be sent to:', data.email);
      console.log('   Reset link:', resetLink);
      return true;
    }

    // Verify transporter can connect
    console.log('[Email Service] Attempting to send reset email to:', data.email);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', data.email);
    console.log('   Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return false;
  }
}

// Send a generic alert email (used for threshold violations)
export async function sendAlertEmail(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"WSN IoT Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffcc00; color: #222; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fff8e1; padding: 20px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ การแจ้งเตือนระบบ</h2>
            </div>
            <div class="content">
              <p>${message}</p>
              <p>เวลาส่ง: ${new Date().toLocaleString('th-TH')}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WSN IoT Management Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    if (!process.env.EMAIL_USER) {
      console.log('📧 [Email Service - Dev Mode] Alert email would be sent to:', to);
      console.log('   Subject:', subject);
      console.log('   Message:', message);
      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log('✅ Alert email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Failed to send alert email:', error);
    return false;
  }
}

// Send notification to DynamoDB NotificationLogs
export async function logNotification(
  dynamoDb: any,
  userId: string,
  email: string,
  type: 'welcome' | 'login' | 'alert',
  status: 'sent' | 'failed',
  message: string
): Promise<void> {
  try {
    const params = {
      TableName: process.env.DYNAMODB_NOTIFICATION_LOGS_TABLE || 'NotificationLogs',
      Item: {
        notificationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        email,
        type,
        status,
        message,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    };

    await dynamoDb.put(params);
    console.log('📝 Notification logged to DynamoDB');
  } catch (error) {
    console.error('❌ Failed to log notification:', error);
  }
}
