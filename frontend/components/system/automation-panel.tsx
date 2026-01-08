"use client"

import { useState } from "react"
import { AutomationRule, Sensor, LedStatus, SensorType } from "@/types/system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  Power,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface AutomationRuleFormProps {
  sensors: Sensor[]
  leds: LedStatus[]
  onSubmit: (rule: Omit<AutomationRule, "id" | "createdAt" | "triggerCount">) => void
  isLoading?: boolean
}

/**
 * แบบฟอร์มสร้างเงื่อนไขอัตโนมัติ
 */
export function AutomationRuleForm({
  sensors,
  leds,
  onSubmit,
  isLoading = false,
}: AutomationRuleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    sensorId: "",
    sensorProperty: "",
    condition: ">",
    targetValue: "",
    targetLedId: "",
    targetLedAction: "on" as "on" | "off",
    isActive: true,
  })

  const selectedSensor = sensors.find((s) => s.id === formData.sensorId)

  // ตัวเลือก property สำหรับแต่ละประเภทเซ็นเซอร์
  const getPropertiesForSensor = () => {
    if (!selectedSensor) return []
    switch (selectedSensor.type) {
      case "temperature_humidity":
        return [
          { value: "temperature", label: "อุณหภูมิ (°C)" },
          { value: "humidity", label: "ความชื้นอากาศ (%)" },
        ]
      case "light":
        return [
          { value: "illuminance", label: "ความเข้มแสง (lux)" },
        ]
      case "soil_moisture":
        return [
          { value: "moisture", label: "ความชื้นในดิน (%)" },
        ]
      default:
        return []
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name ||
      !formData.sensorId ||
      !formData.sensorProperty ||
      !formData.targetValue ||
      !formData.targetLedId
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    const selectedSensorData = sensors.find(
      (s) => s.id === formData.sensorId
    )
    const sensorType = selectedSensorData?.type as SensorType

    onSubmit({
      name: formData.name,
      sensorId: formData.sensorId,
      sensorType: sensorType,
      sensorProperty: formData.sensorProperty,
      condition: formData.condition as ">"|"<"|"=",
      targetValue: parseFloat(formData.targetValue),
      targetLedId: formData.targetLedId as "led_1"|"led_2",
      targetLedAction: formData.targetLedAction,
      isActive: formData.isActive,
    })

    // รีเซ็ตฟอร์ม
    setFormData({
      name: "",
      sensorId: "",
      sensorProperty: "",
      condition: ">",
      targetValue: "",
      targetLedId: "",
      targetLedAction: "on",
      isActive: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ชื่อเงื่อนไข */}
      <div>
        <Label htmlFor="rule-name" className="text-sm font-medium">
          ชื่อเงื่อนไข
        </Label>
        <Input
          id="rule-name"
          placeholder="เช่น: เปิด LED เมื่ออุณหภูมิสูง"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      {/* เลือกเซ็นเซอร์ */}
      <div>
        <Label htmlFor="sensor-select" className="text-sm font-medium">
          เลือกเซ็นเซอร์
        </Label>
        <Select
          value={formData.sensorId}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              sensorId: value,
              sensorProperty: "", // รีเซ็ต property
            })
          }
          disabled={isLoading}
        >
          <SelectTrigger id="sensor-select">
            <SelectValue placeholder="เลือกเซ็นเซอร์..." />
          </SelectTrigger>
          <SelectContent>
            {sensors.map((sensor) => (
              <SelectItem key={sensor.id} value={sensor.id}>
                {sensor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* เลือก Property */}
      {selectedSensor && (
        <div>
          <Label htmlFor="property-select" className="text-sm font-medium">
            คุณสมบัติ
          </Label>
          <Select
            value={formData.sensorProperty}
            onValueChange={(value) =>
              setFormData({ ...formData, sensorProperty: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="property-select">
              <SelectValue placeholder="เลือกคุณสมบัติ..." />
            </SelectTrigger>
            <SelectContent>
              {getPropertiesForSensor().map((prop) => (
                <SelectItem key={prop.value} value={prop.value}>
                  {prop.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* เงื่อนไข */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="condition-select" className="text-sm font-medium">
            เงื่อนไข
          </Label>
          <Select
            value={formData.condition}
            onValueChange={(value) =>
              setFormData({ ...formData, condition: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger id="condition-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=">">มากกว่า ({">"}) </SelectItem>
              <SelectItem value="<">น้อยกว่า ({"<"})</SelectItem>
              <SelectItem value="=">เท่ากับ (=)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="target-value" className="text-sm font-medium">
            ค่า
          </Label>
          <Input
            id="target-value"
            type="number"
            placeholder="ค่า"
            value={formData.targetValue}
            onChange={(e) =>
              setFormData({ ...formData, targetValue: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="unit" className="text-sm font-medium">
            หน่วย
          </Label>
          <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50 dark:bg-gray-900">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {selectedSensor && formData.sensorProperty
                ? (() => {
                    const props = getPropertiesForSensor()
                    const prop = props.find(
                      (p) => p.value === formData.sensorProperty
                    )
                    return prop
                      ? prop.label.split("(")[1]?.replace(")", "")
                      : ""
                  })()
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* เลือก LED */}
      <div>
        <Label htmlFor="led-select" className="text-sm font-medium">
          เลือก LED ที่ต้องการควบคุม
        </Label>
        <Select
          value={formData.targetLedId}
          onValueChange={(value) =>
            setFormData({ ...formData, targetLedId: value })
          }
          disabled={isLoading}
        >
          <SelectTrigger id="led-select">
            <SelectValue placeholder="เลือก LED..." />
          </SelectTrigger>
          <SelectContent>
            {leds.map((led) => (
              <SelectItem key={led.id} value={led.id}>
                {led.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* การกระทำ LED */}
      <div>
        <Label htmlFor="action-select" className="text-sm font-medium">
          การกระทำ
        </Label>
        <Select
          value={formData.targetLedAction}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              targetLedAction: value as "on" | "off",
            })
          }
          disabled={isLoading}
        >
          <SelectTrigger id="action-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on">เปิด (ON)</SelectItem>
            <SelectItem value="off">ปิด (OFF)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ปุ่มส่ง */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        {isLoading ? "กำลังสร้าง..." : "สร้างเงื่อนไข"}
      </Button>
    </form>
  )
}

interface AutomationRuleListProps {
  rules: AutomationRule[]
  sensors: Sensor[]
  onDelete: (ruleId: string) => void
  onToggle?: (ruleId: string, isActive: boolean) => void
  isLoading?: boolean
}

/**
 * ส่วนแสดงรายการเงื่อนไขอัตโนมัติ
 */
export function AutomationRuleList({
  rules,
  sensors,
  onDelete,
  onToggle,
  isLoading = false,
}: AutomationRuleListProps) {
  const getSensorName = (sensorId: string) => {
    return sensors.find((s) => s.id === sensorId)?.name || "เซ็นเซอร์ที่ไม่รู้จัก"
  }

  const getRuleDescription = (rule: AutomationRule) => {
    const sensorName = getSensorName(rule.sensorId)
    const property = rule.sensorProperty
    const operator = rule.condition === ">" ? "มากกว่า" : rule.condition === "<" ? "น้อยกว่า" : "เท่ากับ"
    const action = rule.targetLedAction === "on" ? "เปิด" : "ปิด"

    return `${sensorName} (${property}) ${operator} ${rule.targetValue} → ${action} ${rule.targetLedId}`
  }

  if (rules.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>ไม่มีเงื่อนไขอัตโนมัติ</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{rule.name}</h4>
                <Badge
                  className={
                    rule.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-400 text-white"
                  }
                >
                  {rule.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getRuleDescription(rule)}
              </p>
              {rule.lastTriggered && (
                <p className="text-xs text-gray-500">
                  สัมผัส {rule.triggerCount} ครั้ง | ครั้งล่าสุด:{" "}
                  {new Date(rule.lastTriggered).toLocaleTimeString("th-TH")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* ปุ่มสลับการเปิดใช้งาน */}
              {onToggle && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggle(rule.id, !rule.isActive)}
                  disabled={isLoading}
                >
                  {rule.isActive ? (
                    <Power className="h-4 w-4 text-green-500" />
                  ) : (
                    <Power className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              )}

              {/* ปุ่มลบ */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>
                    ยืนยันการลบเงื่อนไข
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    ต้องการลบเงื่อนไข "{rule.name}" หรือไม่?
                    การกระทำนี้ไม่สามารถยกเลิกได้
                  </AlertDialogDescription>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(rule.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      ลบ
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface AutomationPanelProps {
  rules: AutomationRule[]
  sensors: Sensor[]
  leds: LedStatus[]
  onCreate: (rule: Omit<AutomationRule, "id" | "createdAt" | "triggerCount">) => void
  onDelete: (ruleId: string) => void
  onToggle?: (ruleId: string, isActive: boolean) => void
  isLoading?: boolean
}

/**
 * ส่วนระบบเงื่อนไขอัตโนมัติ (Automation Rules)
 */
export function AutomationPanel({
  rules,
  sensors,
  leds,
  onCreate,
  onDelete,
  onToggle,
  isLoading = false,
}: AutomationPanelProps) {
  const [showForm, setShowForm] = useState(false)

  const handleCreate = (
    rule: Omit<AutomationRule, "id" | "createdAt" | "triggerCount">
  ) => {
    onCreate(rule)
    setShowForm(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            ระบบเงื่อนไขอัตโนมัติ
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มเงื่อนไข
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* แบบฟอร์มสร้างเงื่อนไข */}
        {showForm && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="font-medium mb-4">สร้างเงื่อนไขใหม่</h3>
            <AutomationRuleForm
              sensors={sensors}
              leds={leds}
              onSubmit={handleCreate}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* รายการเงื่อนไข */}
        <div>
          <h3 className="font-medium mb-3">
            เงื่อนไขที่ใช้งาน ({rules.length})
          </h3>
          <AutomationRuleList
            rules={rules}
            sensors={sensors}
            onDelete={onDelete}
            onToggle={onToggle}
            isLoading={isLoading}
          />
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-600 dark:text-blue-400">
            <p className="font-medium">หมายเหตุ:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>เงื่อนไขอ้างอิงเซ็นเซอร์เป็นรายตัว ไม่ผูกกับเซ็นเซอร์รวม</li>
              <li>รองรับการเพิ่มเซ็นเซอร์ใหม่ในอนาคต</li>
              <li>เงื่อนไขใช้ข้อมูลจำลองในปัจจุบัน</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
