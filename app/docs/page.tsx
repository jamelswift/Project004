"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertCircle, CheckCircle, Code, Wifi, Cloud, Zap } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              คู่มือการใช้งาน
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              WSN IoT Platform - ระบบจัดการเซ็นเซอร์และอุปกรณ์ควบคุมบนคลาวด์
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
              <TabsTrigger value="user">สำหรับผู้ใช้</TabsTrigger>
              <TabsTrigger value="admin">สำหรับแอดมิน</TabsTrigger>
              <TabsTrigger value="esp32">การตั้งค่า ESP32</TabsTrigger>
              <TabsTrigger value="aws">การตั้งค่า AWS</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    เกี่ยวกับระบบ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Cloud-Based Management Platform for Versatile Sensor and Actuator Wireless Sensor Networks (WSN)
                    เป็นระบบจัดการเซ็นเซอร์และอุปกรณ์ควบคุมแบบไร้สายบนคลาวด์ที่ออกแบบมาเพื่อรองรับการใช้งานในระดับองค์กร
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-semibold">ขีดความสามารถของระบบ:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>รับข้อมูลอุณหภูมิ, ความชื้น, แสง, ฝน แบบเรียลไทม์จากเซ็นเซอร์ ESP32</li>
                      <li>เชื่อมต่อกับ AWS IoT Core สำหรับการสื่อสารที่ปลอดภัย</li>
                      <li>แสดงข้อมูลสภาพอากาศจาก OpenWeatherMap API</li>
                      <li>ควบคุมอุปกรณ์ไฟฟ้า, พัดลม, สปริงเกอร์ผ่านเว็บแอปพลิเคชัน</li>
                      <li>ระบบแจ้งเตือนอัตโนมัติผ่านอีเมล</li>
                      <li>Virtual Sensor Simulator สำหรับทดสอบระบบ</li>
                      <li>การวิเคราะห์สภาพสวน/ต้นไม้และให้คำแนะนำ</li>
                      <li>รองรับผู้ใช้งานไม่ต่ำกว่า 50 คนพร้อมกัน</li>
                      <li>จัดเก็บข้อมูลได้ไม่ต่ำกว่า 1,000 ครั้งต่อวินาที</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle>ข้อมูลการเข้าสู่ระบบ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700 dark:text-green-400">บัญชีผู้ใช้ทั่วไป (User)</AlertTitle>
                      <AlertDescription className="space-y-1 text-green-600 dark:text-green-300">
                        <p>
                          อีเมล:{" "}
                          <code className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                            user@wsn.com
                          </code>
                        </p>
                        <p>
                          รหัสผ่าน:{" "}
                          <code className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                            password123
                          </code>
                        </p>
                        <p className="text-xs mt-2">สามารถดูข้อมูลเซ็นเซอร์, ใช้ Simulator และควบคุมอุปกรณ์</p>
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-700 dark:text-blue-400">บัญชีผู้ดูแลระบบ (Admin)</AlertTitle>
                      <AlertDescription className="space-y-1 text-blue-600 dark:text-blue-300">
                        <p>
                          อีเมล:{" "}
                          <code className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                            admin@wsn.com
                          </code>
                        </p>
                        <p>
                          รหัสผ่าน:{" "}
                          <code className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">password123</code>
                        </p>
                        <p className="text-xs mt-2">สามารถเข้าถึงฟังก์ชันการจัดการทั้งหมด รวมถึงการตั้งค่าระบบ</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Tab */}
            <TabsContent value="user" className="space-y-6">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle>คู่มือสำหรับผู้ใช้งานทั่วไป</CardTitle>
                  <CardDescription>วิธีการใช้งานระบบสำหรับผู้ใช้ทั่วไป</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">1. การเข้าสู่ระบบ</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>เปิดเว็บไซต์ WSN IoT Platform</li>
                      <li>
                        กรอกอีเมล: <code className="font-mono bg-muted px-2 py-1 rounded">user@wsn.com</code>
                      </li>
                      <li>
                        กรอกรหัสผ่าน: <code className="font-mono bg-muted px-2 py-1 rounded">password123</code>
                      </li>
                      <li>คลิกปุ่ม "เข้าสู่ระบบ"</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">2. การดูข้อมูลเซ็นเซอร์ (แดชบอร์ด)</h4>
                    <p className="text-sm text-muted-foreground">หลังจากเข้าสู่ระบบ คุณจะเห็นแดชบอร์ดที่แสดง:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <strong>อุณหภูมิปัจจุบัน:</strong> ค่าอุณหภูมิจากเซ็นเซอร์ ESP32 (หน่วย °C)
                      </li>
                      <li>
                        <strong>ความชื้น:</strong> ค่าความชื้นสัมพัทธ์ (หน่วย %)
                      </li>
                      <li>
                        <strong>สถานะการเชื่อมต่อ:</strong> แสดงสถานะออนไลน์/ออฟไลน์
                      </li>
                      <li>
                        <strong>สภาพอากาศ:</strong> ข้อมูลจาก OpenWeatherMap API
                      </li>
                      <li>
                        <strong>กราฟอุณหภูมิ:</strong> แสดงข้อมูล 24 ชั่วโมงย้อนหลัง
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">3. การใช้งาน Simulator</h4>
                    <p className="text-sm text-muted-foreground">คลิกเมนู "Simulator" เพื่อเข้าสู่หน้าจำลองเซ็นเซอร์</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>คลิกปุ่ม "เริ่มจำลอง" เพื่อเริ่มการทำงาน</li>
                      <li>ระบบจะจำลองค่าเซ็นเซอร์ทั้งหมด: อุณหภูมิ, ความชื้น, แสง, ฝน, PM2.5</li>
                      <li>ข้อมูลจะอัพเดททุก 3 วินาที</li>
                      <li>ระบบควบคุมอัตโนมัติจะทำงาน (LED, พัดลม, สปริงเกอร์)</li>
                      <li>ดูคำแนะนำการดูแลสวน/ต้นไม้จากการวิเคราะห์สภาพแวดล้อม</li>
                      <li>คลิก "หยุดจำลอง" เพื่อหยุดการทำงาน หรือ "รีเซ็ต" เพื่อเริ่มใหม่</li>
                    </ol>
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Simulator จำลองรอบวันคืนจริง (06:00-18:00 = กลางวัน, 18:00-06:00 = กลางคืน)
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">4. การควบคุมอุปกรณ์</h4>
                    <p className="text-sm text-muted-foreground">คลิกเมนู "ควบคุม" เพื่อเข้าสู่หน้าควบคุมอุปกรณ์</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        <strong>ควบคุมไฟ:</strong> เปิด/ปิดหลอดไฟแต่ละดวงด้วยสวิตช์
                      </li>
                      <li>
                        <strong>ควบคุมพัดลม:</strong> ปรับความเร็วพัดลม 0-100% ด้วย Slider
                      </li>
                      <li>
                        <strong>ควบคุมสปริงเกอร์:</strong> เปิด/ปิดสปริงเกอร์รดน้ำ
                      </li>
                      <li>
                        <strong>โหมดอัตโนมัติ:</strong> เปิดใช้เพื่อให้ระบบควบคุมตามเวลา
                      </li>
                      <li>
                        <strong>เปิด/ปิดทั้งหมด:</strong> ใช้ปุ่มด้านบนเพื่อควบคุมอุปกรณ์ทั้งหมดพร้อมกัน
                      </li>
                    </ol>
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>การควบคุมอุปกรณ์จะใช้เวลา 1-2 วินาทีในการประมวลผล</AlertDescription>
                    </Alert>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">5. การดูประวัติข้อมูล</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>คลิกเมนู "ประวัติ" ที่แถบนำทาง</li>
                      <li>ระบบจะแสดงตารางข้อมูลเซ็นเซอร์ทั้งหมด</li>
                      <li>ข้อมูลที่แสดง: วันที่/เวลา, อุปกรณ์, อุณหภูมิ, ความชื้น</li>
                      <li>ข้อมูลจะเรียงจากล่าสุดไปเก่าสุด</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>คู่มือสำหรับผู้ดูแลระบบ</CardTitle>
                  <CardDescription>วิธีการใช้งานและจัดการระบบสำหรับแอดมิน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">1. การเข้าสู่ระบบแอดมิน</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>เปิดเว็บไซต์ WSN IoT Platform</li>
                      <li>
                        กรอกอีเมล: <code className="font-mono bg-muted px-2 py-1 rounded">admin@wsn.com</code>
                      </li>
                      <li>
                        กรอกรหัสผ่าน: <code className="font-mono bg-muted px-2 py-1 rounded">password123</code>
                      </li>
                      <li>ระบบจะนำคุณไปยังแดชบอร์ดแอดมินโดยอัตโนมัติ</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">2. แดชบอร์ดแอดมิน</h4>
                    <p className="text-sm text-muted-foreground">แดชบอร์ดแอดมินแสดงข้อมูลภาพรวมของระบบ:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <strong>อุปกรณ์ทั้งหมด:</strong> จำนวนอุปกรณ์ที่เชื่อมต่อในระบบ
                      </li>
                      <li>
                        <strong>ผู้ใช้งาน:</strong> จำนวนผู้ใช้ทั้งหมด
                      </li>
                      <li>
                        <strong>ข้อมูลที่บันทึก:</strong> จำนวนจุดข้อมูลในฐานข้อมูล
                      </li>
                      <li>
                        <strong>สถานะระบบ:</strong> แสดงสถานะการทำงานของระบบ
                      </li>
                      <li>
                        <strong>ข้อมูล AWS IoT:</strong> สถานะการเชื่อมต่อและ Policy
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">3. การจัดการอุปกรณ์</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>คลิกเมนู "จัดการอุปกรณ์"</li>
                      <li>ระบบจะแสดงรายการอุปกรณ์ทั้งหมดพร้อมสถานะ</li>
                      <li>สามารถเปิด/ปิดอุปกรณ์แต่ละตัวได้โดยคลิกสวิตช์</li>
                      <li>ดูรายละเอียดอุปกรณ์: รหัสอุปกรณ์, ประเภท, เวลาอัพเดทล่าสุด</li>
                      <li>คลิกปุ่ม "รีเฟรช" เพื่ออัพเดทสถานะล่าสุด</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">4. การตั้งค่าระบบ</h4>
                    <p className="text-sm text-muted-foreground">คลิกเมนู "ตั้งค่า" เพื่อเข้าถึงการตั้งค่าต่างๆ:</p>

                    <div className="space-y-4 mt-4">
                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-semibold">การตั้งค่า AWS IoT</h5>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>WiFi SSID และ Password สำหรับ ESP32</li>
                          <li>
                            IoT Policy: <code className="font-mono">wsn-iot-policy</code>
                          </li>
                          <li>AWS Endpoint สำหรับการเชื่อมต่อ</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-semibold">การตั้งค่าการแจ้งเตือน</h5>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>
                            <strong>เปิดใช้การแจ้งเตือนทางอีเมล:</strong> รับแจ้งเตือนเมื่อถึงเวลาควบคุมไฟ
                          </li>
                          <li>
                            <strong>ควบคุมอัตโนมัติ:</strong> เปิด/ปิดไฟอัตโนมัติตามเวลา
                          </li>
                          <li>
                            <strong>เวลาเช้า (ปิดไฟ):</strong> ตั้งค่าเวลาที่ต้องการปิดไฟ (เริ่มต้น 06:00)
                          </li>
                          <li>
                            <strong>เวลามืด (เปิดไฟ):</strong> ตั้งค่าเวลาที่ต้องการเปิดไฟ (เริ่มต้น 18:00)
                          </li>
                          <li>
                            <strong>อีเมลสำหรับรับการแจ้งเตือน:</strong> ระบุอีเมลที่ต้องการรับแจ้งเตือน
                          </li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-primary pl-4">
                        <h5 className="font-semibold">การตั้งค่า Weather API</h5>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>API URL และ API Key สำหรับ OpenWeatherMap</li>
                          <li>เมืองที่ต้องการแสดงสภาพอากาศ (เริ่มต้น: Bangkok)</li>
                        </ul>
                      </div>
                    </div>

                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>อย่าลืมคลิก "บันทึกการตั้งค่า" หลังจากทำการเปลี่ยนแปลงใดๆ</AlertDescription>
                    </Alert>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">5. การทำงานของระบบแจ้งเตือนอัตโนมัติ</h4>
                    <p className="text-sm text-muted-foreground">ระบบจะทำงานดังนี้:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        <strong>เวลาเช้า (06:00-08:00):</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>ระบบตรวจสอบเวลาอัตโนมัติ</li>
                          <li>ส่งคำสั่งปิดไฟทุกดวง</li>
                          <li>ส่งอีเมลแจ้งเตือนถึงแอดมิน</li>
                        </ul>
                      </li>
                      <li>
                        <strong>เวลามืด (18:00-20:00):</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>ระบบตรวจสอบเวลาอัตโนมัติ</li>
                          <li>ส่งคำสั่งเปิดไฟทุกดวง</li>
                          <li>ส่งอีเมลแจ้งเตือนถึงแอดมิน</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ESP32 Tab */}
            <TabsContent value="esp32" className="space-y-6">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-600" />
                    การตั้งค่า ESP32
                  </CardTitle>
                  <CardDescription>คู่มือการเขียนโปรแกรมและเชื่อมต่อ ESP32 กับระบบ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      1. อุปกรณ์ที่ต้องใช้
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>บอร์ด ESP32 Development Board</li>
                      <li>เซ็นเซอร์วัดอุณหภูมิ (LM35 หรือ DHT22)</li>
                      <li>รีเลย์สำหรับควบคุมไฟ (5V Relay Module 2 Channel)</li>
                      <li>หลอดไฟ LED หรือหลอดไฟจริง 220V</li>
                      <li>สายจัมเปอร์และเบรดบอร์ด</li>
                      <li>สาย USB Type-C สำหรับอัพโหลดโค้ด</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">2. การเชื่อมต่อฮาร์ดแวร์</h4>
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm space-y-3 border border-blue-200 dark:border-blue-800">
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-400">📡 เซ็นเซอร์อุณหภูมิ (LM35):</p>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>VCC → 3.3V</li>
                          <li>OUT → GPIO34 (ADC1_CH6)</li>
                          <li>GND → GND</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-400">💡 รีเลย์ควบคุมไฟ:</p>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>VCC → 5V (ใช้ VIN)</li>
                          <li>IN1 → GPIO26 (หลอดไฟ 1)</li>
                          <li>IN2 → GPIO27 (หลอดไฟ 2)</li>
                          <li>GND → GND</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-blue-500" />
                      3. ข้อมูลการเชื่อมต่อ
                    </h4>
                    <div className="bg-muted p-4 rounded-lg text-sm space-y-3 font-mono border">
                      <div>
                        <p className="font-semibold mb-1">📶 WiFi Configuration:</p>
                        <p className="text-blue-600">
                          SSID: <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Getzy</span>
                        </p>
                        <p className="text-blue-600">
                          Password:{" "}
                          <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Wipatsasicha7</span>
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold mb-1">☁️ AWS IoT Configuration:</p>
                        <p className="text-cyan-600">
                          Policy: <span className="bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">wsn-iot-policy</span>
                        </p>
                        <p className="text-cyan-600">
                          Thing Name: <span className="bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">ESP32_001</span>
                        </p>
                        <p className="text-cyan-600">
                          Region: <span className="bg-cyan-100 dark:bg-cyan-900 px-2 py-1 rounded">your-region</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">4. ไฟล์ Certificates ที่ต้องใช้</h4>
                    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        ⚠️ ต้องนำไฟล์ certificates ทั้ง 3 ไฟล์ไปใส่ในโค้ด ESP32 (ดูตัวอย่างด้านล่าง)
                      </AlertDescription>
                    </Alert>
                    <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">AmazonRootCA1.pem</code> - Root CA Certificate
                        (ใช้ได้กับทุกอุปกรณ์)
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">certificate.pem.crt</code> - Device Certificate
                        (เฉพาะอุปกรณ์นี้)
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">private.pem.key</code> - Private Key (ห้ามเผยแพร่!)
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">5. ตัวอย่างโค้ด ESP32 (Arduino IDE)</h4>
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 dark:text-blue-400">
                        📦 ต้องติดตั้งไลบรารี: WiFi, WiFiClientSecure, PubSubClient, ArduinoJson
                      </AlertDescription>
                    </Alert>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                      <pre>{`#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ข้อมูล WiFi
const char* ssid = "Getzy";
const char* password = "Wipatsasicha7";

// ข้อมูล AWS IoT
const char* mqtt_server = "your-endpoint.iot.region.amazonaws.com";
const int mqtt_port = 8883;
const char* thing_name = "ESP32_001";

// MQTT Topics
const char* pub_topic = "wsn/sensor/ESP32_001/data";
const char* sub_topic = "wsn/device/+/control";

// Pin definitions
#define TEMP_SENSOR_PIN 34
#define RELAY1_PIN 26
#define RELAY2_PIN 27

// Certificates (ใส่ข้อมูลจาก AWS IoT)
const char* root_ca = R"EOF(
-----BEGIN CERTIFICATE-----
[ใส่ AmazonRootCA1.pem ที่นี่]
-----END CERTIFICATE-----
)EOF";

const char* certificate = R"EOF(
-----BEGIN CERTIFICATE-----
[ใส่ certificate.pem.crt ที่นี่]
-----END CERTIFICATE-----
)EOF";

const char* private_key = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
[ใส่ private.pem.key ที่นี่]
-----END RSA PRIVATE KEY-----
)EOF";

WiFiClientSecure net;
PubSubClient client(net);

void setup() {
  Serial.begin(115200);
  
  // ตั้งค่า Pin
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW);
  digitalWrite(RELAY2_PIN, LOW);
  
  // เชื่อมต่อ WiFi
  connectWiFi();
  
  // ตั้งค่า Certificates
  net.setCACert(root_ca);
  net.setCertificate(certificate);
  net.setPrivateKey(private_key);
  
  // เชื่อมต่อ AWS IoT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(messageCallback);
  
  connectAWS();
}

void loop() {
  if (!client.connected()) {
    connectAWS();
  }
  client.loop();
  
  // อ่านค่าเซ็นเซอร์และส่งข้อมูลทุก 5 วินาที
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 5000) {
    publishSensorData();
    lastSend = millis();
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void connectAWS() {
  Serial.print("Connecting to AWS IoT");
  
  while (!client.connect(thing_name)) {
    Serial.print(".");
    delay(1000);
  }
  
  if (!client.connected()) {
    Serial.println("AWS IoT Timeout!");
    return;
  }
  
  Serial.println("\\nAWS IoT Connected!");
  client.subscribe(sub_topic);
  Serial.println("Subscribed to: " + String(sub_topic));
}

void publishSensorData() {
  // อ่านค่าอุณหภูมิจาก LM35
  int adcValue = analogRead(TEMP_SENSOR_PIN);
  float voltage = (adcValue / 4095.0) * 3.3;
  float temperature = voltage * 100.0; // LM35: 10mV/°C
  
  // สร้าง JSON
  StaticJsonDocument<200> doc;
  doc["deviceId"] = thing_name;
  doc["temperature"] = temperature;
  doc["humidity"] = random(40, 80); // ถ้ามีเซ็นเซอร์ความชื้นให้เปลี่ยนตรงนี้
  doc["timestamp"] = millis();
  
  char jsonBuffer[200];
  serializeJson(doc, jsonBuffer);
  
  // ส่งข้อมูล
  if (client.publish(pub_topic, jsonBuffer)) {
    Serial.println("Data sent: " + String(jsonBuffer));
  } else {
    Serial.println("Failed to send data");
  }
}

void messageCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  
  // แปลง payload เป็น String
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // Parse JSON
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("Failed to parse JSON");
    return;
  }
  
  // ควบคุมอุปกรณ์
  String action = doc["action"];
  String device = doc["device"];
  
  if (device == "light1") {
    digitalWrite(RELAY1_PIN, action == "on" ? HIGH : LOW);
    Serial.println("Light 1: " + action);
  }
  else if (device == "light2") {
    digitalWrite(RELAY2_PIN, action == "on" ? HIGH : LOW);
    Serial.println("Light 2: " + action);
  }
}`}</pre>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">6. ขั้นตอนการอัพโหลดโค้ด</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>เปิด Arduino IDE</li>
                      <li>ไปที่ Tools → Board → ESP32 Arduino → ESP32 Dev Module</li>
                      <li>เลือก Port ที่เชื่อมต่อกับ ESP32</li>
                      <li>คัดลอกโค้ดด้านบนและแทนที่ข้อมูล Certificates</li>
                      <li>แก้ไข mqtt_server ให้ตรงกับ AWS Endpoint ของคุณ</li>
                      <li>คลิก Upload (หรือกด Ctrl+U)</li>
                      <li>เปิด Serial Monitor (115200 baud) เพื่อดูสถานะ</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AWS Tab */}
            <TabsContent value="aws" className="space-y-6">
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-600" />
                    การตั้งค่า AWS IoT Core
                  </CardTitle>
                  <CardDescription>คู่มือการตั้งค่า AWS IoT สำหรับเชื่อมต่อ ESP32</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      คุณได้รับ Certificates และ Policy แล้ว สามารถใช้ข้อมูลด้านลากมาใส่ในโค้ด ESP32 และตั้งค่าระบบ
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">1. ข้อมูล AWS IoT ที่มีอยู่</h4>
                    <div className="bg-muted p-4 rounded-lg text-sm space-y-2 font-mono border">
                      <p>
                        <strong>Policy Name:</strong> <span className="text-blue-600">wsn-iot-policy</span>
                      </p>
                      <p>
                        <strong>Thing Name:</strong> <span className="text-cyan-600">ESP32_001</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">💡 ใช้ข้อมูลนี้ในการตั้งค่า ESP32</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">2. Certificates ที่ได้รับ</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="font-semibold text-sm text-green-700 dark:text-green-400">✅ AmazonRootCA3.pem</p>
                        <p className="text-xs text-muted-foreground mt-1">Root CA Certificate - ใช้ได้กับทุกอุปกรณ์</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="font-semibold text-sm text-green-700 dark:text-green-400">✅ AmazonRootCA1.pem</p>
                        <p className="text-xs text-muted-foreground mt-1">Root CA Certificate - Alternative</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">🔐 certificate.pem.crt</p>
                        <p className="text-xs text-muted-foreground mt-1">Device Certificate - เฉพาะอุปกรณ์นี้</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="font-semibold text-sm text-red-700 dark:text-red-400">🔒 private.pem.key</p>
                        <p className="text-xs text-muted-foreground mt-1">Private Key - เก็บเป็นความลับ!</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-400">📄 public.pem.key</p>
                        <p className="text-xs text-muted-foreground mt-1">Public Key - ใช้สำหรับยืนยันตัวตน</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">3. MQTT Topics ที่ใช้</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="font-semibold text-blue-700 dark:text-blue-400">📤 Publish (ESP32 → Cloud):</p>
                        <code className="text-xs font-mono">wsn/sensor/ESP32_001/data</code>
                        <p className="text-xs text-muted-foreground mt-1">ใช้ส่งข้อมูลเซ็นเซอร์จาก ESP32 ไปยัง Cloud</p>
                      </div>
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                        <p className="font-semibold text-cyan-700 dark:text-cyan-400">📥 Subscribe (Cloud → ESP32):</p>
                        <code className="text-xs font-mono">wsn/device/+/control</code>
                        <p className="text-xs text-muted-foreground mt-1">ใช้รับคำสั่งควบคุมจาก Cloud ไปยัง ESP32</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="font-semibold text-green-700 dark:text-green-400">🔄 Status Updates:</p>
                        <code className="text-xs font-mono">wsn/actuator/status</code>
                        <p className="text-xs text-muted-foreground mt-1">อัพเดทสถานะอุปกรณ์ควบคุม</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">4. ตัวอย่างข้อมูลที่ส่ง (JSON Format)</h4>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono">
                      <p className="text-gray-400 mb-2">// ข้อมูลเซ็นเซอร์ที่ส่งไปยัง Cloud:</p>
                      <pre>{`{
  "deviceId": "ESP32_001",
  "temperature": 28.5,
  "humidity": 65.2,
  "timestamp": 1234567890
}`}</pre>
                      <p className="text-gray-400 mt-4 mb-2">// คำสั่งควบคุมจาก Cloud:</p>
                      <pre>{`{
  "device": "light1",
  "action": "on"
}`}</pre>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">5. การทดสอบการเชื่อมต่อ</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>อัพโหลดโค้ดลง ESP32</li>
                      <li>เปิด Serial Monitor ดูสถานะการเชื่อมต่อ</li>
                      <li>เข้าเว็บแอปพลิเคชันและตรวจสอบว่าข้อมูลแสดงผลหรือไม่</li>
                      <li>ทดสอบควบคุมหลอดไฟจากเว็บ</li>
                      <li>ตรวจสอบ Serial Monitor ว่าได้รับคำสั่งหรือไม่</li>
                    </ol>
                  </div>

                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-700 dark:text-yellow-400">⚠️ คำเตือนด้านความปลอดภัย</AlertTitle>
                    <AlertDescription className="text-yellow-600 dark:text-yellow-300 space-y-1">
                      <p>• ห้ามเผยแพร่ไฟล์ Private Key ให้ผู้อื่น</p>
                      <p>• ใช้ WiFi ที่ปลอดภัยเท่านั้น</p>
                      <p>• เปลี่ยน Policy ถ้าสงสัยว่าถูกโจมตี</p>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>ต้องการความช่วยเหลือเพิ่มเติม?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">หากพบปัญหาหรือต้องการคำแนะนำเพิ่มเติม กรุณาติดต่อทีมสนับสนุน</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">อีเมล:</span>
                  <span>support@wsn-platform.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">เอกสารเพิ่มเติม:</span>
                  <a href="https://docs.aws.amazon.com/iot/" className="text-primary hover:underline">
                    AWS IoT Docs
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
