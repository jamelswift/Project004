'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, Edit2, RefreshCw } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  deviceType: string;
  macAddress: string;
  ipAddress: string;
  status: 'online' | 'offline';
  lastUpdate: string;
  firmwareVersion?: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (device: Device) => {
    setEditingDevice(device);
    setEditName(device.name);
    setEditType(device.deviceType);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDevice) return;

    try {
      setUpdating(editingDevice.id);

      // Update name if changed
      if (editName !== editingDevice.name) {
        const nameResponse = await fetch(`/api/devices/${editingDevice.id}/name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName }),
        });
        if (!nameResponse.ok) throw new Error('Failed to update name');
      }

      // Update type if changed
      if (editType !== editingDevice.deviceType) {
        const typeResponse = await fetch(`/api/devices/${editingDevice.id}/type`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceType: editType }),
        });
        if (!typeResponse.ok) throw new Error('Failed to update type');
      }

      // Refresh devices list
      await fetchDevices();
      setShowEditDialog(false);
      setEditingDevice(null);
    } catch (error) {
      console.error('Error updating device:', error);
      alert('ไม่สามารถอัพเดทอุปกรณ์ได้');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('คุณแน่ใจหรือว่าต้องการลบอุปกรณ์นี้?')) return;

    try {
      setDeleting(deviceId);
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchDevices();
      } else {
        alert('ไม่สามารถลบอุปกรณ์ได้');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('ไม่สามารถลบอุปกรณ์ได้');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getDeviceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      light: 'bg-yellow-100 text-yellow-800',
      sensor: 'bg-blue-100 text-blue-800',
      actuator: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">จัดการอุปกรณ์</h1>
          <p className="text-gray-500 mt-1">จัดการและปรับแต่งอุปกรณ์ที่เชื่อมต่อ</p>
        </div>
        <Button onClick={fetchDevices} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>อุปกรณ์ที่เชื่อมต่อ</CardTitle>
          <CardDescription>
            {devices.length} อุปกรณ์ที่ลงทะเบียน
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>ยังไม่มีอุปกรณ์ที่ลงทะเบียน</p>
              <p className="text-sm mt-2">รอการเชื่อมต่ออุปกรณ์ฮาร์ดแวร์หรือกลับมาตรวจสอบอีกครั้งในภายหลัง</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่ออุปกรณ์</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>อัพเดทล่าสุด</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.name}</TableCell>
                      <TableCell>
                        <Badge className={getDeviceTypeColor(device.deviceType)}>
                          {device.deviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(device.status)}>
                          {device.status === 'online' ? '🟢' : '🔴'} {device.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {device.macAddress}
                      </TableCell>
                      <TableCell className="text-sm">{device.ipAddress}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(device.lastUpdate).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          onClick={() => handleEditClick(device)}
                          variant="outline"
                          size="sm"
                          disabled={updating === device.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(device.id)}
                          variant="destructive"
                          size="sm"
                          disabled={deleting === device.id}
                        >
                          {deleting === device.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขอุปกรณ์</DialogTitle>
            <DialogDescription>
              เปลี่ยนชื่อและประเภทอุปกรณ์
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่ออุปกรณ์</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Living Room Light"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ประเภทอุปกรณ์</label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="actuator">Actuator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingDevice && (
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <p><strong>รหัสอุปกรณ์:</strong> {editingDevice.id}</p>
                <p><strong>MAC Address:</strong> {editingDevice.macAddress}</p>
                <p><strong>ที่อยู่ IP:</strong> {editingDevice.ipAddress}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updating !== null}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim() || updating !== null}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการเปลี่ยนแปลง'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
