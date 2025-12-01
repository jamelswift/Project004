"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, Book } from "lucide-react"
import { getCurrentUser, logout } from "@/lib/auth"
import Link from "next/link"
import type { User } from "@/types"

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) return null

  return (
    <nav className="border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="flex flex-col">
              <span className="font-bold text-lg">WSN Management Platform</span>
              <span className="text-xs opacity-90">Cloud-Based Sensor & Actuator Control System</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {user.role === "admin" ? (
              <>
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/devices">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Devices
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Settings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/aws-iot">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    AWS IoT
                  </Button>
                </Link>
                <Link href="/dashboard/control">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Control
                  </Button>
                </Link>
                <Link href="/dashboard/schedule">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Schedule
                  </Button>
                </Link>
                <Link href="/dashboard/weather">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Weather
                  </Button>
                </Link>
                <Link href="/dashboard/simulator">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Virtual Sensor Simulator
                  </Button>
                </Link>
              </>
            )}
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Book className="h-4 w-4 mr-2" />
                Docs
              </Button>
            </Link>

            <div className="h-6 w-px bg-white/30 mx-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/20">
            {user.role === "admin" ? (
              <>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/devices" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Devices
                  </Button>
                </Link>
                <Link href="/admin/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Settings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/aws-iot" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    AWS IoT
                  </Button>
                </Link>
                <Link href="/dashboard/control" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Control
                  </Button>
                </Link>
                <Link href="/dashboard/schedule" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Schedule
                  </Button>
                </Link>
                <Link href="/dashboard/weather" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Weather
                  </Button>
                </Link>
                <Link href="/dashboard/simulator" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                    Virtual Sensor Simulator
                  </Button>
                </Link>
              </>
            )}
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-white/20">
                <Book className="h-4 w-4 mr-2" />
                Docs
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
