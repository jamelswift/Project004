"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ensureCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Power, AlertCircle, CheckCircle2, Zap, Wifi } from "lucide-react"

interface RelayState {
  relay1: 'on' | 'off'
  relay2: 'on' | 'off'
  lastUpdate: string
}

export default function ControlPage() {
  const [relayState, setRelayState] = useState<RelayState>({
    relay1: 'off',
    relay2: 'off',
    lastUpdate: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    let source: EventSource | null = null

    const start = async () => {
      const user = await ensureCurrentUser()
      if (!user) {
        router.push('/')
        return
      }

      // Open SSE stream for live updates
      source = new EventSource(`${API_URL}/api/relay/stream`)
      source.onopen = () => {
        setConnected(true)
        setError('')
      }
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RelayState
          setRelayState(data)
          setConnected(true)
          setError('')
        } catch (err) {
          console.error('Failed to parse relay update:', err)
        }
      }
      source.onerror = (err) => {
        console.error('SSE error:', err)
        setConnected(false)
        setError('Realtime connection lost. Retrying...')
      }
    }

    start()

    return () => {
      if (source) source.close()
    }
  }, [router, API_URL])

  const updateRelay = async (relay: 'relay1' | 'relay2', value: 'on' | 'off') => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        [relay]: value,
      }

      const response = await fetch(`${API_URL}/api/relay/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setRelayState(data.state)
        console.log(`[Control] ${relay} set to ${value}`)
      } else {
        setError('Failed to update relay')
      }
    } catch (err) {
      setError('Error updating relay: ' + String(err))
      console.error('Error updating relay:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleRelay = (relay: 'relay1' | 'relay2') => {
    const newState = relayState[relay] === 'on' ? 'off' : 'on'
    updateRelay(relay, newState)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Relay Control
              </h1>
              <p className="text-muted-foreground mt-2">
                Control 2-channel relay connected to ESP32
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600 animate-pulse" />
                  <Badge className="bg-green-600">Connected</Badge>
                </>
              ) : (
                <>
                  <Wifi className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">Disconnected</Badge>
                </>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                System Status
              </CardTitle>
              <CardDescription>Backend API and relay module connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Backend API:</span>
                  <Badge variant={connected ? 'default' : 'destructive'}>
                    {connected ? '✅ Online' : '❌ Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Relay Module:</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Update:</span>
                  <span className="font-mono text-xs">
                    {new Date(relayState.lastUpdate).toLocaleTimeString('th-TH')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relay Controls */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Relay 1 */}
            <Card className={`border-2 transition ${relayState.relay1 === 'on' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className={`h-5 w-5 ${relayState.relay1 === 'on' ? 'text-blue-600' : 'text-gray-400'}`} />
                  Relay Channel 1
                </CardTitle>
                <CardDescription>GPIO 26 (IN1)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Display */}
                <div className="flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-3">
                      <Power className={`h-16 w-16 mx-auto ${relayState.relay1 === 'on' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <Badge
                      className={`text-lg px-6 py-2 ${
                        relayState.relay1 === 'on' ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                      variant="secondary"
                    >
                      {relayState.relay1.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Toggle Button */}
                <Button
                  onClick={() => toggleRelay('relay1')}
                  disabled={loading || !connected}
                  className={`w-full py-6 text-lg font-semibold ${
                    relayState.relay1 === 'on'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  variant={relayState.relay1 === 'on' ? 'destructive' : 'default'}
                >
                  {loading ? 'Updating...' : relayState.relay1 === 'on' ? 'Turn OFF' : 'Turn ON'}
                </Button>

                {/* Switch Alternative */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Label htmlFor="relay1-switch" className="font-medium">
                    Quick Toggle
                  </Label>
                  <Switch
                    id="relay1-switch"
                    checked={relayState.relay1 === 'on'}
                    onCheckedChange={() => toggleRelay('relay1')}
                    disabled={loading || !connected}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Relay 2 */}
            <Card className={`border-2 transition ${relayState.relay2 === 'on' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className={`h-5 w-5 ${relayState.relay2 === 'on' ? 'text-purple-600' : 'text-gray-400'}`} />
                  Relay Channel 2
                </CardTitle>
                <CardDescription>GPIO 27 (IN2)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Display */}
                <div className="flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-3">
                      <Power className={`h-16 w-16 mx-auto ${relayState.relay2 === 'on' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <Badge
                      className={`text-lg px-6 py-2 ${
                        relayState.relay2 === 'on' ? 'bg-purple-600' : 'bg-gray-400'
                      }`}
                      variant="secondary"
                    >
                      {relayState.relay2.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Toggle Button */}
                <Button
                  onClick={() => toggleRelay('relay2')}
                  disabled={loading || !connected}
                  className={`w-full py-6 text-lg font-semibold ${
                    relayState.relay2 === 'on'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  variant={relayState.relay2 === 'on' ? 'destructive' : 'default'}
                >
                  {loading ? 'Updating...' : relayState.relay2 === 'on' ? 'Turn OFF' : 'Turn ON'}
                </Button>

                {/* Switch Alternative */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Label htmlFor="relay2-switch" className="font-medium">
                    Quick Toggle
                  </Label>
                  <Switch
                    id="relay2-switch"
                    checked={relayState.relay2 === 'on'}
                    onCheckedChange={() => toggleRelay('relay2')}
                    disabled={loading || !connected}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <strong>Step 1:</strong> Click "Turn ON/OFF" button or toggle the switch
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <strong>Step 2:</strong> Backend API updates relay state
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <strong>Step 3:</strong> ESP32 polls backend every 1 second
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <strong>Step 4:</strong> ESP32 controls GPIO 26/27 → Relay triggers → Load turns ON/OFF
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
