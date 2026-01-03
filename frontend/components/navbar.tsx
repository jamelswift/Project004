"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Menu,
  X,
  Book,
  LayoutDashboard,
  Cloud,
  Sliders,
  Calendar,
  Sun,
  Cpu,
} from "lucide-react"
import { getCurrentUser, logout } from "@/lib/auth"
import Link from "next/link"
import type { User } from "@/types"

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) return null

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/")

  const navButtonClass = (active: boolean) =>
    `flex items-center gap-2 transition-all ${
      active
        ? "bg-white text-blue-600 shadow-sm"
        : "text-white hover:bg-white/20"
    }`

  return (
    <nav className="sticky top-0 z-50 border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={user.role === "admin" ? "/admin" : "/dashboard"}
            className="flex flex-col"
          >
            <span className="font-bold text-lg tracking-tight">
              WSN Management Platform
            </span>
            <span className="text-xs opacity-90">
              Cloud-Based Sensor & Actuator Control
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {user.role !== "admin" && (
              <>
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={navButtonClass(isActive("/dashboard"))}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                <Link href="/dashboard/aws-iot">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={navButtonClass(isActive("/dashboard/aws-iot"))}
                  >
                    <Cloud className="h-4 w-4" />
                    AWS IoT
                  </Button>
                </Link>

                <Link href="/dashboard/control">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={navButtonClass(isActive("/dashboard/control"))}
                  >
                    <Sliders className="h-4 w-4" />
                    Control
                  </Button>
                </Link>

                <Link href="/dashboard/schedule">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={navButtonClass(isActive("/dashboard/schedule"))}
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </Link>

                <Link href="/dashboard/weather">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={navButtonClass(isActive("/dashboard/weather"))}
                  >
                    <Sun className="h-4 w-4" />
                    Weather
                  </Button>
                </Link>

                {/* ⭐ Simulator – Highlight */}
                <Link href="/dashboard/simulator">
                  <Button
                    size="sm"
                    className={`flex items-center gap-2 rounded-full px-4 transition-all ${
                      isActive("/dashboard/simulator")
                        ? "bg-white text-blue-600 shadow-md"
                        : "bg-white/20 hover:bg-white hover:text-blue-600"
                    }`}
                  >
                    <Cpu className="h-4 w-4" />
                    Simulator
                  </Button>
                </Link>
              </>
            )}

            <Link href="/docs">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 flex items-center gap-2"
              >
                <Book className="h-4 w-4" />
                Docs
              </Button>
            </Link>

            <div className="h-6 w-px bg-white/30 mx-2" />

            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
    </nav>
  )
}
