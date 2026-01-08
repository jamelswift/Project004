"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

const data = [
  { time: "00:00", temp: 24, hum: 60 },
  { time: "04:00", temp: 23, hum: 65 },
  { time: "08:00", temp: 26, hum: 55 },
  { time: "12:00", temp: 32, hum: 45 },
  { time: "16:00", temp: 29, hum: 50 },
  { time: "20:00", temp: 26, hum: 58 },
  { time: "23:59", temp: 25, hum: 62 },
]

export function DashboardCharts() {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 w-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Environment Overview
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Real-time temperature and humidity trends
        </p>
      </div>

      <div className="w-full h-64 min-h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>

              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

            <XAxis dataKey="time" />
            <YAxis />

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
              formatter={(value, name) =>
                name === "temp"
                  ? [`${value} °C`, "Temperature"]
                  : [`${value} %`, "Humidity"]
              }
            />

            {/* Safe temperature reference */}
            <ReferenceLine
              y={30}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "Warning 30°C", fill: "#ef4444", fontSize: 12 }}
            />

            <Area
              type="monotone"
              dataKey="hum"
              stroke="#22c55e"
              fill="url(#humGradient)"
              strokeWidth={2}
              name="Humidity"
            />

            <Area
              type="monotone"
              dataKey="temp"
              stroke="#3b82f6"
              fill="url(#tempGradient)"
              strokeWidth={3}
              name="Temperature"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Current conditions are within normal operating range.
      </p>
    </div>
  )
}
