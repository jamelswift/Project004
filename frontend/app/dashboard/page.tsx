import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentDevicesTable } from "@/components/recent-devices-table"
import { Activity, Users, Zap, Radio } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* TOP SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+4 from last month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">112</div>
            <p className="text-xs text-muted-foreground">+12 since last hour</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2 kW</div>
            <p className="text-xs text-muted-foreground">-5% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* CHART + SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT CHART SECTION with title */}
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-lg font-semibold">Temperature & Humidity Overview</h2>
          <p className="text-sm text-muted-foreground">
            Real-time sensor data from the main warehouse.
          </p>

          <DashboardCharts />
        </div>

        {/* SYSTEM STATUS PANEL */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <p className="text-xs text-muted-foreground">
              Current status of connected devices.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Main Gateway</p>
                <p className="text-xs text-muted-foreground">Online • 99.9% Uptime</p>
              </div>
              <span className="text-green-600 font-semibold">Active</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sensor Node A</p>
                <p className="text-xs text-muted-foreground">Online • Battery 85%</p>
              </div>
              <span className="text-green-600 font-semibold">Active</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sensor Node B</p>
                <p className="text-xs text-muted-foreground">Offline • Last seen 2h ago</p>
              </div>
              <span className="text-red-600 font-semibold">Offline</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Actuator Controller</p>
                <p className="text-xs text-muted-foreground">Online • Idle</p>
              </div>
              <span className="text-green-600 font-semibold">Active</span>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* RECENT DEVICES SECTION */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDevicesTable />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
