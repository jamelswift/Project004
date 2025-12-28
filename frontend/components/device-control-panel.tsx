"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Power, Loader2, Wifi, WifiOff, Shield, Users } from 'lucide-react';

interface Device {
  deviceId: string;
  deviceName: string;
  thingName: string;
  deviceType: string;
  status: string;
  lastSeen?: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions: string[];
  isOwner: boolean;
}

export default function DeviceControlPanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [controlling, setControlling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUserDevices();
  }, []);

  const fetchUserDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/devices', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.data || []);
        if (data.data?.length > 0) {
          setSelectedDevice(data.data[0]);
        }
      } else {
        showMessage('error', 'Failed to load devices');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      showMessage('error', 'Error loading devices');
    } finally {
      setLoading(false);
    }
  };

  const controlDevice = async (action: string, value?: any) => {
    if (!selectedDevice) return;

    setControlling(true);
    try {
      const response = await fetch(`/api/devices/${selectedDevice.deviceId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, value })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Command "${action}" sent to ${selectedDevice.deviceName}`);
      } else {
        showMessage('error', data.error || 'Failed to control device');
      }
    } catch (error) {
      console.error('Error controlling device:', error);
      showMessage('error', 'Error sending command');
    } finally {
      setControlling(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-blue-500';
      case 'user': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No devices available. Register a device to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              My Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedDevice?.deviceId === device.deviceId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
                onClick={() => setSelectedDevice(device)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{device.deviceName}</p>
                    <p className="text-xs opacity-70">{device.deviceId}</p>
                  </div>
                  {device.status === 'online' ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleBadgeColor(device.role)}>
                    {device.role}
                  </Badge>
                  {device.isOwner && (
                    <Shield className="w-3 h-3" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Device Control */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Control Panel</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDevice ? (
              <div className="space-y-6">
                {/* Device Info */}
                <div className="p-4 bg-secondary rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedDevice.deviceName}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Device ID:</span> {selectedDevice.deviceId}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span> {selectedDevice.deviceType}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className={getStatusColor(selectedDevice.status)}>{selectedDevice.status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Your Role:</span>{' '}
                      <Badge className={getRoleBadgeColor(selectedDevice.role)}>{selectedDevice.role}</Badge>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground text-sm">Permissions:</span>
                    <div className="flex gap-1 mt-1">
                      {selectedDevice.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                {selectedDevice.permissions.includes('control') ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Device Control</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => controlDevice('on')}
                        disabled={controlling}
                        className="h-20"
                      >
                        {controlling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5 mr-2" />}
                        Turn ON
                      </Button>
                      <Button
                        onClick={() => controlDevice('off')}
                        disabled={controlling}
                        variant="outline"
                        className="h-20"
                      >
                        {controlling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5 mr-2" />}
                        Turn OFF
                      </Button>
                    </div>
                    
                    {selectedDevice.deviceType === 'dimmer' && (
                      <div>
                        <label className="text-sm font-medium">Brightness</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full mt-2"
                          onChange={(e) => controlDevice('setBrightness', parseInt(e.target.value))}
                          disabled={controlling}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                    You don't have control permission for this device. Contact the owner to request access.
                  </div>
                )}

                {/* Share Button */}
                {selectedDevice.permissions.includes('share') && (
                  <Button variant="outline" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Share Device
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a device to control
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
