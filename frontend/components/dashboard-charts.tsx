"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
    { time: "00:00", temp: 24, humidity: 60 },
    { time: "04:00", temp: 23, humidity: 65 },
    { time: "08:00", temp: 26, humidity: 55 },
    { time: "12:00", temp: 32, humidity: 45 },
    { time: "16:00", temp: 30, humidity: 50 },
    { time: "20:00", temp: 27, humidity: 58 },
    { time: "23:59", temp: 25, humidity: 62 },
]

export function DashboardCharts() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Temperature & Humidity Overview</CardTitle>
                    <CardDescription>
                        Real-time sensor data from the main warehouse.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Area type="monotone" dataKey="temp" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                                <Area type="monotone" dataKey="humidity" stroke="var(--chart-2)" fillOpacity={1} fill="url(#colorHum)" name="Humidity (%)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>
                        Current status of connected devices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <div className="flex items-center">
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">Main Gateway</p>
                                <p className="text-sm text-muted-foreground">Online • 99.9% Uptime</p>
                            </div>
                            <div className="ml-auto font-medium text-green-500">Active</div>
                        </div>
                        <div className="flex items-center">
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">Sensor Node A</p>
                                <p className="text-sm text-muted-foreground">Online • Battery 85%</p>
                            </div>
                            <div className="ml-auto font-medium text-green-500">Active</div>
                        </div>
                        <div className="flex items-center">
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">Sensor Node B</p>
                                <p className="text-sm text-muted-foreground">Offline • Last seen 2h ago</p>
                            </div>
                            <div className="ml-auto font-medium text-red-500">Offline</div>
                        </div>
                        <div className="flex items-center">
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">Actuator Controller</p>
                                <p className="text-sm text-muted-foreground">Online • Idle</p>
                            </div>
                            <div className="ml-auto font-medium text-green-500">Active</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
