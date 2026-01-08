"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Bell,
  Search,
  User,
  LayoutDashboard,
  Thermometer,
  Clock,
  CloudSun,
  Radio,
  Cpu,
  LogOut,
  BookOpen,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"
import { useLanguage } from "@/contexts/language-context"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  /* ============================= */
  /* Active State (สำคัญมาก)       */
  /* ============================= */
  const isDashboard =
    pathname === "/dashboard" || pathname === "/dashboard/"

  const routes = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      active: isDashboard,
    },
    {
      label: "ระบบควบคุม",
      icon: Cpu,
      href: "/dashboard/system",
      active: pathname.startsWith("/dashboard/system") || pathname.startsWith("/dashboard/control"),
    },
    {
      label: t("schedule"),
      icon: Clock,
      href: "/dashboard/schedule",
      active: pathname.startsWith("/dashboard/schedule"),
    },
    {
      label: t("weather"),
      icon: CloudSun,
      href: "/dashboard/weather",
      active: pathname.startsWith("/dashboard/weather"),
    },
    {
      label: t("simulator"),
      icon: Radio,
      href: "/dashboard/simulator",
      active: pathname.startsWith("/dashboard/simulator"),
    },
    {
      label: t("aws_iot"),
      icon: CloudSun,
      href: "/dashboard/aws-iot",
      active: pathname.startsWith("/dashboard/aws-iot"),
    },
    {
      label: t("docs"),
      icon: BookOpen,
      href: "/docs",
      active: pathname.startsWith("/docs"),
    },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto px-8">
        <div className="flex h-16 items-center gap-6">

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-4">

            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("search_placeholder")}
                className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white h-10"
              />
            </div>

            {/* Notification */}
            <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-gray-50">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl bg-gray-50 hover:bg-gray-100"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("my_account")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">{t("profile")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">{t("settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </header>
  )
}
