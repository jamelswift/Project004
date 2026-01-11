"use client"

import { useState } from "react"
import { LedStatus } from "@/types/system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Lightbulb, Info } from "lucide-react"

interface LedControlProps {
  ledStatus: LedStatus
  onToggle: (ledId: string, isOn: boolean) => void
  isLoading?: boolean
}

/**
 * การ์ดควบคุม LED เดี่ยว
 */
export function LedControlCard({
  ledStatus,
  onToggle,
  isLoading = false,
}: LedControlProps) {
  const handleToggle = () => {
    onToggle(ledStatus.id, !ledStatus.isOn)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{ledStatus.name}</CardTitle>
          <Lightbulb
            className={`h-6 w-6 ${
              ledStatus.isOn
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* สถานะ */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            สถานะ:
          </span>
          <Badge
            className={
              ledStatus.isOn
                ? "bg-green-500 text-white"
                : "bg-gray-400 text-white"
            }
          >
            {ledStatus.isOn ? "เปิด" : "ปิด"}
          </Badge>
        </div>

        {/* แหล่งที่มา */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            ควบคุมโดย:
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                ledStatus.source === "manual"
                  ? "bg-blue-50"
                  : "bg-purple-50"
              }
            >
              {ledStatus.source === "manual" ? "ผู้ใช้ " : "เงื่อนไขอัตโนมัติ"}
            </Badge>
          </div>
          {ledStatus.lastChangedBy && (
            <p className="text-xs text-gray-500 mt-1">
              โดย: {ledStatus.lastChangedBy}
            </p>
          )}
        </div>

        {/* เวลาเปลี่ยนแปลง */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            เปลี่ยน:{" "}
            <span className="font-mono">
              {new Date(ledStatus.timestamp).toLocaleTimeString("th-TH")}
            </span>
          </p>
        </div>

        {/* ปุ่มควบคุม */}
        <div className="pt-2">
          <Button
            onClick={handleToggle}
            disabled={isLoading}
            className={`w-full ${
              ledStatus.isOn
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isLoading
              ? "กำลังประมวลผล..."
              : ledStatus.isOn
                ? "ปิด"
                : "เปิด"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface LedControlPanelProps {
  ledStatuses: LedStatus[]
  onToggle: (ledId: string, isOn: boolean) => void
  isLoading?: boolean
  variant?: "card" | "plain"
}

/**
 * ส่วนควบคุมอุปกรณ์ Output (LED)
 */
export function LedControlPanel({
  ledStatuses,
  onToggle,
  isLoading = false,
  variant = "card",
}: LedControlPanelProps) {
  const [selectedLed, setSelectedLed] = useState<string | null>(null)

  const handleToggle = (ledId: string, isOn: boolean) => {
    setSelectedLed(ledId)
    onToggle(ledId, isOn)
    setTimeout(() => setSelectedLed(null), 1000)
  }

  const content = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ledStatuses.map((led) => (
          <LedControlCard
            key={led.id}
            ledStatus={led}
            onToggle={handleToggle}
            isLoading={isLoading && selectedLed === led.id}
          />
        ))}
      </div>

    </>
  )

  if (variant === "plain") {
    return content
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          ระบบควบคุม LED
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
