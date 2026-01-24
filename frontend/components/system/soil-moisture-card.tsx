'use client'

import React, { useState, useEffect } from 'react'
import { Droplet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SoilMoistureData {
  sensorId: string
  name: string
  type: string
  value?: number
  moisture?: number
  unit: string
  timestamp: string
  location: string
  isActive?: boolean
}

export function SoilMoistureCard() {
  const [soilData, setSoilData] = useState<SoilMoistureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('ไม่มีข้อมูล')

  useEffect(() => {
    const fetchSoilMoistureData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch soil moisture sensor data from backend (port 3000)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/sensors/SOIL_MOISTURE_001`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch soil moisture data')
        }
        
        const data = await response.json()
        setSoilData(data)
        
        // Format last update time
        if (data.timestamp) {
          const updateTime = new Date(data.timestamp)
          setLastUpdate(updateTime.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Error fetching soil moisture data:', err)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchSoilMoistureData()

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchSoilMoistureData, 3000)

    return () => clearInterval(interval)
  }, [])

  // Determine moisture level status
  const getMoistureStatus = (value?: number) => {
    if (value === undefined) return { label: 'ไม่มีข้อมูล', color: 'text-gray-500', bgColor: 'bg-gray-50' }
    if (value >= 70) return { label: 'ชื้นมาก', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (value >= 40) return { label: 'ปกติ', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (value >= 20) return { label: 'แห้ง', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    return { label: 'แห้งมาก', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  const moistureValue = soilData?.moisture || soilData?.value
  const status = getMoistureStatus(moistureValue)

  return (
    <Card className={`rounded-3xl border-2 shadow-lg ${status.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Droplet className={`h-5 w-5 ${status.color}`} />
            <div>
              <CardTitle className="text-lg font-bold">
                {soilData?.name || 'เซ็นเซอร์ความชื้นในดิน'}
              </CardTitle>
              <CardDescription className="text-xs">
                {soilData?.location || 'Garden'}
              </CardDescription>
            </div>
          </div>
          {soilData?.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs text-white">
              ✓ ใช้งาน
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin inline-block">
              <Droplet className="h-8 w-8 text-blue-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Moisture Level Display */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">ระดับความชื้น</div>
              <div className="text-4xl font-bold">
                {moistureValue?.toFixed(1) || '0'}
                <span className="text-xl text-gray-600 ml-2">{soilData?.unit || '%'}</span>
              </div>
              <div className={`text-sm font-semibold ${status.color}`}>
                {status.label}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (moistureValue || 0) >= 70 ? 'bg-blue-500' :
                    (moistureValue || 0) >= 40 ? 'bg-green-500' :
                    (moistureValue || 0) >= 20 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(moistureValue || 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div>
                <p className="text-xs text-gray-600">รหัสเซ็นเซอร์</p>
                <p className="text-sm font-mono text-gray-800">{soilData?.sensorId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">อัปเดตล่าสุด</p>
                <p className="text-sm font-mono text-gray-800">{lastUpdate}</p>
              </div>
            </div>

            {/* Moisture Indicators */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="text-center p-2 bg-white rounded border">
                <p className="text-xs text-gray-600">สถานะดิน</p>
                <p className="text-xs font-semibold mt-1">
                  {(moistureValue || 0) >= 60 ? 'เปียก' :
                   (moistureValue || 0) >= 40 ? 'ปกติ' :
                   (moistureValue || 0) >= 20 ? 'แห้ง' :
                   'แห้งมาก'}
                </p>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <p className="text-xs text-gray-600">สถานะ</p>
                <p className="text-xs font-semibold mt-1 text-green-600">
                  {soilData?.isActive ? '✓ ทำงาน' : '✗ ปิด'}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
