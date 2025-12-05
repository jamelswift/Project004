"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

const devices = [
    {
        id: "DEV-001",
        name: "Temperature Sensor 1",
        type: "Sensor",
        location: "Warehouse A",
        status: "Active",
        lastUpdate: "2 mins ago",
    },
    {
        id: "DEV-002",
        name: "Humidity Sensor 1",
        type: "Sensor",
        location: "Warehouse A",
        status: "Active",
        lastUpdate: "2 mins ago",
    },
    {
        id: "DEV-003",
        name: "Cooling Fan",
        type: "Actuator",
        location: "Server Room",
        status: "Idle",
        lastUpdate: "1 hour ago",
    },
    {
        id: "DEV-004",
        name: "Motion Detector",
        type: "Sensor",
        location: "Entrance",
        status: "Warning",
        lastUpdate: "5 mins ago",
    },
    {
        id: "DEV-005",
        name: "Main Light Switch",
        type: "Actuator",
        location: "Office",
        status: "Active",
        lastUpdate: "10 mins ago",
    },
]

export function RecentDevicesTable() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Last Update</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.map((device) => (
                        <TableRow key={device.id}>
                            <TableCell className="font-medium">{device.id}</TableCell>
                            <TableCell>{device.name}</TableCell>
                            <TableCell>{device.type}</TableCell>
                            <TableCell>{device.location}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        device.status === "Active" ? "default" :
                                            device.status === "Warning" ? "destructive" : "secondary"
                                    }
                                >
                                    {device.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{device.lastUpdate}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
