"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { DeviceStatus } from "@/types"
import { Wifi, Power, Activity, Lightbulb, Plus, Share2, MoreVertical, Edit2, Trash2, Eye, Settings } from "lucide-react"

export default function UserDevicesPage() {
	const [devices, setDevices] = useState<DeviceStatus[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>("")
	const router = useRouter()

	// Add Device Dialog
	const [showAddDevice, setShowAddDevice] = useState(false)
	const [addDeviceId, setAddDeviceId] = useState("")
	const [addingDevice, setAddingDevice] = useState(false)

	// Share Device Dialog
	const [showShareDevice, setShowShareDevice] = useState(false)
	const [selectedDevice, setSelectedDevice] = useState<DeviceStatus | null>(null)
	const [shareEmail, setShareEmail] = useState("")
	const [shareRole, setShareRole] = useState("viewer")
	const [sharingDevice, setSharingDevice] = useState(false)

	// Edit Device Dialog
	const [showEditDevice, setShowEditDevice] = useState(false)
	const [editDeviceId, setEditDeviceId] = useState("")
	const [editDeviceName, setEditDeviceName] = useState("")
	const [editingDevice, setEditingDevice] = useState(false)

	// Delete Device Dialog
	const [showDeleteDevice, setShowDeleteDevice] = useState(false)
	const [deleteDeviceId, setDeleteDeviceId] = useState("")
	const [deletingDevice, setDeletingDevice] = useState(false)

	// Device Details Dialog
	const [showDeviceDetails, setShowDeviceDetails] = useState(false)
	const [detailsDevice, setDetailsDevice] = useState<DeviceStatus | null>(null)

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

	useEffect(() => {
		const verify = async () => {
			const user = await ensureCurrentUser()
			if (!user) {
				router.push("/")
				return
			}
			fetchDevices()
		}
		verify()
	}, [router])

	const fetchDevices = async () => {
		setLoading(true)
		try {
			const response = await fetch(`${API_URL}/api/user/devices`, { credentials: "include" })
			const json = await response.json()
			if (!response.ok) {
				throw new Error(json.error || "Failed to fetch devices")
			}
			const items = json?.data || []
			setDevices(items as DeviceStatus[])
			setError("")
		} catch (err: any) {
			setError(err?.message || "ไม่สามารถโหลดข้อมูลอุปกรณ์ได้")
		} finally {
			setLoading(false)
		}
	}

	const controlDevice = async (deviceId: string, turnOn: boolean) => {
		try {
			const res = await fetch(`${API_URL}/api/devices/${encodeURIComponent(deviceId)}/control`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "switch", value: turnOn ? "on" : "off" })
			})
			if (res.ok) {
				fetchDevices()
			}
		} catch (err) {
			console.error("Control device error:", err)
		}
	}

	const handleAddDevice = async () => {
		if (!addDeviceId.trim()) return
		setAddingDevice(true)
		try {
			const res = await fetch(`${API_URL}/api/devices/${encodeURIComponent(addDeviceId.trim())}/share`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetUserId: "", role: "owner" })
			})
			if (res.ok) {
				setAddDeviceId("")
				setShowAddDevice(false)
				await fetchDevices()
			} else {
				const json = await res.json()
				alert("ไม่สามารถเพิ่มอุปกรณ์ได้: " + (json.error || "Unknown error"))
			}
		} catch (err) {
			console.error("Add device error:", err)
			alert("เกิดข้อผิดพลาด: " + String(err))
		} finally {
			setAddingDevice(false)
		}
	}

	const handleShareDevice = async () => {
		if (!selectedDevice || !shareEmail.trim()) return
		setSharingDevice(true)
		try {
			const res = await fetch(`${API_URL}/api/devices/${encodeURIComponent(selectedDevice.deviceId)}/share`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ targetEmail: shareEmail.trim(), role: shareRole })
			})
			if (res.ok) {
				setShareEmail("")
				setShowShareDevice(false)
				setSelectedDevice(null)
				await fetchDevices()
			} else {
				const json = await res.json()
				alert("ไม่สามารถแชร์อุปกรณ์ได้: " + (json.error || "Unknown error"))
			}
		} catch (err) {
			console.error("Share device error:", err)
			alert("เกิดข้อผิดพลาด: " + String(err))
		} finally {
			setSharingDevice(false)
		}
	}

	const handleEditDevice = async () => {
		if (!editDeviceId.trim() || !editDeviceName.trim()) return
		setEditingDevice(true)
		try {
			const res = await fetch(`${API_URL}/api/devices/${encodeURIComponent(editDeviceId)}/update`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ name: editDeviceName.trim() })
			})
			if (res.ok) {
				setEditDeviceId("")
				setEditDeviceName("")
				setShowEditDevice(false)
				setSelectedDevice(null)
				await fetchDevices()
			} else {
				const json = await res.json()
				alert("ไม่สามารถแก้ไขอุปกรณ์ได้: " + (json.error || "Unknown error"))
			}
		} catch (err) {
			console.error("Edit device error:", err)
			alert("เกิดข้อผิดพลาด: " + String(err))
		} finally {
			setEditingDevice(false)
		}
	}

	const handleDeleteDevice = async () => {
		if (!deleteDeviceId.trim()) return
		setDeletingDevice(true)
		try {
			const res = await fetch(`${API_URL}/api/devices/${encodeURIComponent(deleteDeviceId)}/delete`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include"
			})
			if (res.ok) {
				setDeleteDeviceId("")
				setShowDeleteDevice(false)
				setSelectedDevice(null)
				await fetchDevices()
			} else {
				const json = await res.json()
				alert("ไม่สามารถลบอุปกรณ์ได้: " + (json.error || "Unknown error"))
			}
		} catch (err) {
			console.error("Delete device error:", err)
			alert("เกิดข้อผิดพลาด: " + String(err))
		} finally {
			setDeletingDevice(false)
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<main className="container mx-auto px-4 py-8 space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">อุปกรณ์ของฉัน</h1>
						<p className="text-muted-foreground">อุปกรณ์ที่คุณเข้าถึงได้</p>
					</div>
					<div className="flex items-center gap-2">
						<Button onClick={() => setShowAddDevice(true)} className="gap-2">
							<Plus className="h-4 w-4" />
							เพิ่มอุปกรณ์ใหม่
						</Button>
						<Button onClick={fetchDevices} disabled={loading}>
							โหลดใหม่
						</Button>
					</div>
				</div>

				{error && (
					<div className="p-3 border border-red-300 bg-red-50 text-sm text-red-700 rounded">{error}</div>
				)}

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{devices.map((device) => {
						const online = ["on","online","active"].includes(device.status)
						return (
							<Card key={device.deviceId} className="border relative">
								<CardHeader className="flex flex-row items-start justify-between pb-3">
									<div className="flex-1">
										<CardTitle className="flex items-center gap-2 text-lg">
											{device.type === "light" ? (
												<Lightbulb className={`h-5 w-5 ${online ? "text-yellow-500" : "text-gray-400"}`} />
											) : (
												<Activity className={`h-5 w-5 ${online ? "text-green-600" : "text-gray-400"}`} />
											)}
											{device.name || device.deviceId}
										</CardTitle>
										<CardDescription className="flex items-center gap-2">
											<Wifi className={`h-4 w-4 ${online ? "text-green-600" : "text-gray-400"}`} />
											<Badge variant={online ? "default" : "secondary"}>
												{online ? "ออนไลน์" : "ออฟไลน์"}
											</Badge>
										</CardDescription>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button size="sm" variant="ghost">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => {
													setDetailsDevice(device)
													setShowDeviceDetails(true)
												}}
												className="gap-2 cursor-pointer"
											>
												<Eye className="h-4 w-4" />
												<span>ดูรายละเอียด</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setEditDeviceId(device.deviceId)
													setEditDeviceName(device.name || "")
													setShowEditDevice(true)
												}}
												className="gap-2 cursor-pointer"
											>
												<Edit2 className="h-4 w-4" />
												<span>แก้ไขชื่อ</span>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setSelectedDevice(device)
													setShowShareDevice(true)
												}}
												className="gap-2 cursor-pointer"
											>
												<Share2 className="h-4 w-4" />
												<span>แชร์อุปกรณ์</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => {
													setDeleteDeviceId(device.deviceId)
													setShowDeleteDevice(true)
												}}
												className="gap-2 cursor-pointer text-destructive"
											>
												<Trash2 className="h-4 w-4" />
												<span>ลบอุปกรณ์</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">รหัสอุปกรณ์:</span>
											<span className="font-mono">{device.deviceId}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">ประเภท:</span>
											<span>{device.type}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">อัพเดทล่าสุด:</span>
											<span>{new Date(typeof device.lastUpdate === "string" ? device.lastUpdate : Number(device.lastUpdate)).toLocaleString("th-TH")}</span>
										</div>
									</div>

									{/* Remove old Share button since it's now in dropdown menu */}
									{device.type === "light" && (
										<div className="flex items-center justify-between pt-2 border-t">
											<span className="text-sm font-medium flex items-center gap-2">
												<Power className="h-4 w-4" /> ควบคุมอุปกรณ์
											</span>
											<Switch
												checked={online}
												onCheckedChange={(checked) => controlDevice(device.deviceId, checked)}
											/>
										</div>
									)}
								</CardContent>
							</Card>
						)
					})}

					{!loading && devices.length === 0 && (
						<div className="text-sm text-muted-foreground">ยังไม่มีอุปกรณ์ที่คุณเข้าถึงได้</div>
					)}
				</div>
			</main>

			{/* Add Device Dialog */}
			<Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
						<DialogDescription>
							ใส่รหัสอุปกรณ์ (Device ID หรือ MAC Address) เพื่อเพิ่มเข้าบัญชีของคุณ
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="device-id">Device ID / MAC Address</Label>
							<Input
								id="device-id"
								placeholder="เช่น ESP32_001 หรือ AA:BB:CC:DD:EE:FF"
								value={addDeviceId}
								onChange={(e) => setAddDeviceId(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowAddDevice(false)}
							disabled={addingDevice}
						>
							ยกเลิก
						</Button>
						<Button
							onClick={handleAddDevice}
							disabled={!addDeviceId.trim() || addingDevice}
						>
							{addingDevice ? "กำลังเพิ่ม..." : "เพิ่มอุปกรณ์"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Share Device Dialog */}
			<Dialog open={showShareDevice} onOpenChange={setShowShareDevice}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>แชร์อุปกรณ์</DialogTitle>
						<DialogDescription>
							{selectedDevice?.name || selectedDevice?.deviceId} - แชร์ให้ผู้ใช้อื่น
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="share-email">อีเมลของผู้ใช้</Label>
							<Input
								id="share-email"
								type="email"
								placeholder="user@example.com"
								value={shareEmail}
								onChange={(e) => setShareEmail(e.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor="share-role">สิทธิ์การเข้าถึง</Label>
							<select
								id="share-role"
								value={shareRole}
								onChange={(e) => setShareRole(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="viewer">ดูอย่างเดียว (Viewer)</option>
								<option value="control">ควบคุมได้ (Control)</option>
								<option value="admin">จัดการได้ (Admin)</option>
							</select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowShareDevice(false)}
							disabled={sharingDevice}
						>
							ยกเลิก
						</Button>
						<Button
							onClick={handleShareDevice}
							disabled={!shareEmail.trim() || sharingDevice}
						>
							{sharingDevice ? "กำลังแชร์..." : "แชร์อุปกรณ์"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Device Dialog */}
			<Dialog open={showEditDevice} onOpenChange={setShowEditDevice}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>แก้ไขชื่ออุปกรณ์</DialogTitle>
						<DialogDescription>
							เปลี่ยนชื่ออุปกรณ์เพื่อให้ง่ายในการจำ
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-device-name">ชื่ออุปกรณ์</Label>
							<Input
								id="edit-device-name"
								placeholder="เช่น เซ็นเซอร์อุณหภูมิห้องนั่งเล่น"
								value={editDeviceName}
								onChange={(e) => setEditDeviceName(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowEditDevice(false)}
							disabled={editingDevice}
						>
							ยกเลิก
						</Button>
						<Button
							onClick={handleEditDevice}
							disabled={!editDeviceName.trim() || editingDevice}
						>
							{editingDevice ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Device Dialog */}
			<Dialog open={showDeleteDevice} onOpenChange={setShowDeleteDevice}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-red-600">ลบอุปกรณ์</DialogTitle>
						<DialogDescription>
							การดำเนินการนี้ไม่สามารถยกเลิกได้ อุปกรณ์จะถูกลบออกจากบัญชีของคุณ
						</DialogDescription>
					</DialogHeader>
					<div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
						คุณแน่ใจหรือว่าต้องการลบอุปกรณ์ {deleteDeviceId} ?
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDevice(false)}
							disabled={deletingDevice}
						>
							ยกเลิก
						</Button>
						<Button
							onClick={handleDeleteDevice}
							disabled={deletingDevice}
							variant="destructive"
						>
							{deletingDevice ? "กำลังลบ..." : "ลบอุปกรณ์"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Device Details Dialog */}
			<Dialog open={showDeviceDetails} onOpenChange={setShowDeviceDetails}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>รายละเอียดอุปกรณ์</DialogTitle>
					</DialogHeader>
					{detailsDevice && (
						<div className="space-y-4 text-sm">
							<div className="border-b pb-2">
								<div className="text-muted-foreground mb-1">ชื่อ</div>
								<div className="font-medium">{detailsDevice.name || detailsDevice.deviceId}</div>
							</div>
							<div className="border-b pb-2">
								<div className="text-muted-foreground mb-1">รหัสอุปกรณ์</div>
								<div className="font-mono">{detailsDevice.deviceId}</div>
							</div>
							<div className="border-b pb-2">
								<div className="text-muted-foreground mb-1">ประเภท</div>
								<div className="font-medium">{detailsDevice.type}</div>
							</div>
							<div className="border-b pb-2">
								<div className="text-muted-foreground mb-1">สถานะ</div>
								<Badge variant={["on","online","active"].includes(detailsDevice.status) ? "default" : "secondary"}>
									{["on","online","active"].includes(detailsDevice.status) ? "ออนไลน์" : "ออฟไลน์"}
								</Badge>
							</div>
							<div>
								<div className="text-muted-foreground mb-1">อัพเดทล่าสุด</div>
								<div>{new Date(typeof detailsDevice.lastUpdate === "string" ? detailsDevice.lastUpdate : Number(detailsDevice.lastUpdate)).toLocaleString("th-TH")}</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button onClick={() => setShowDeviceDetails(false)}>ปิด</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
