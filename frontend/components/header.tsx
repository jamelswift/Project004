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
      label: t("control"),
      icon: Thermometer,
      href: "/dashboard/control",
      active: pathname.startsWith("/dashboard/control"),
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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex h-16 items-center gap-6">

          {/* Logo */}
          <div className="text-xl font-bold text-primary whitespace-nowrap">
            {t("iot_manager")}
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {routes.map((route) => (
              <Link key={route.href} href={route.href}>
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200",
                    "hover:bg-primary/10",
                    route.active
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </button>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-4">

            {/* Search */}
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search_placeholder")}
                className="pl-9 rounded-full"
              />
            </div>

            {/* Notification */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-muted hover:bg-muted/80"
                >
                  <User className="h-5 w-5" />
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
