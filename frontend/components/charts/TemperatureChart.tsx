"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface TemperatureChartProps {
  data?: any[];
  threshold?: {
    onAbove: number;
    offBelow: number;
  };
}

export default function TemperatureChart({ 
  data: externalData, 
  threshold 
}: TemperatureChartProps) {
  const [data, setData] = useState<any[]>(externalData || []);
  const [logs, setLogs] = useState<string[]>([]);
  const prevStatus = useRef("SAFE");

  const TEMP_SAFE = threshold?.offBelow || 28;
  const TEMP_ON = threshold?.onAbove || 30;

  /* ======================
     USE EXTERNAL DATA IF PROVIDED
  ====================== */
  useEffect(() => {
    if (externalData && externalData.length > 0) {
      setData(externalData);
    }
  }, [externalData]);

  /* ======================
     SIMULATE SENSOR DATA (FALLBACK)
  ====================== */
  useEffect(() => {
    if (externalData && externalData.length > 0) return;
    
    const interval = setInterval(() => {
      setData((prev) => {
        const lastTemp = prev.length
          ? prev[prev.length - 1].temperature
          : 29;

        const newTemp =
          lastTemp + (Math.random() * 1.4 - 0.6);

        const point = {
          time: new Date().toLocaleTimeString(),
          temperature: Number(newTemp.toFixed(2)),
        };

        return [...prev.slice(-20), point];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [externalData]);

  const currentTemp = data.length
    ? data[data.length - 1].temperature
    : 0;

  /* ======================
     STATUS LOGIC
  ====================== */
  let status = "SAFE";
  let autoRule = "OFF";
  let lineColor = "#3b82f6"; // blue

  if (currentTemp >= TEMP_ON) {
    status = "DANGER";
    autoRule = "ON";
    lineColor = "#ef4444"; // red
  } else if (currentTemp >= TEMP_SAFE) {
    status = "WARNING";
    lineColor = "#f59e0b"; // orange
  }

  /* ======================
     EVENT LOG (ONLY WHEN STATUS CHANGES)
  ====================== */
  useEffect(() => {
    if (prevStatus.current !== status) {
      let message = "";

      if (status === "DANGER") {
        message = `Temperature exceeded ${TEMP_ON}°C → AUTO ON`;
      } else if (status === "WARNING") {
        message = "Temperature reached warning level";
      } else {
        message = "Temperature returned to safe range";
      }

      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${message}`,
      ]);

      prevStatus.current = status;
    }
  }, [status]);

  /* ======================
     UI
  ====================== */
  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-1">
        🌡 Temperature Monitoring
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        Real-time temperature monitoring with automatic rule thresholds
      </p>

      {/* CHART */}
      <div style={{ width: '100%', minHeight: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[20, 40]} unit="°C" />
            <Tooltip />
            <ReferenceLine
              y={TEMP_SAFE}
              stroke="green"
              strokeDasharray="4 4"
              label={`SAFE ${TEMP_SAFE}°C`}
            />
            <ReferenceLine
              y={TEMP_ON}
              stroke="red"
              strokeDasharray="4 4"
              label={`AUTO ON ${TEMP_ON}°C`}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke={lineColor}
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* STATUS SUMMARY */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Current Temperature</p>
          <p className="text-lg font-semibold">
            {currentTemp.toFixed(2)} °C
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">System Status</p>
          <p className="text-lg font-semibold">
            {status}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Auto Rule</p>
          <p className="text-lg font-semibold">
            {autoRule}
          </p>
        </div>
      </div>

      {/* EVENT LOG */}
      <div className="mt-4 p-3 bg-black text-green-400 rounded text-sm font-mono">
        <p className="mb-1">System Log</p>
        {logs.slice(-3).map((log, i) => (
          <p key={`log-${i}-${Date.now()}`}>{log}</p>
        ))}
        {logs.length === 0 && <p>No events yet</p>}
      </div>
    </div>
  );
}
