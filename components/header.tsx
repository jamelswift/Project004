"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Bell, Search, User, LayoutDashboard, Thermometer,
    Clock, CloudSun, Radio, LogOut, BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"
import { useLanguage } from "@/contexts/language-context"

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const { t } = useLanguage()

    // -----------------------------
    // ✅ ฟังก์ชัน logout (สำคัญมาก)
    // -----------------------------
    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const routes = [
        { label: t("dashboard"), icon: LayoutDashboard, href: "/dashboard" },
        { label: t("control"), icon: Thermometer, href: "/dashboard/control" },
        { label: t("schedule"), icon: Clock, href: "/dashboard/schedule" },
        { label: t("weather"), icon: CloudSun, href: "/dashboard/weather" },
        { label: t("simulator"), icon: Radio, href: "/dashboard/simulator" },
        { label: t("aws_iot"), icon: CloudSun, href: "/dashboard/aws-iot" },
        { label: t("docs"), icon: BookOpen, href: "/docs" },
    ]

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 sticky top-0 z-50">
            <div className="flex items-center gap-6 w-full">

                {/* Logo */}
                <div className="font-bold text-xl text-primary">
                    {t("iot_manager")}
                </div>

                {/* Navigation Menu */}
                <nav className="hidden md:flex items-center gap-2">
                    {routes.map((route) => {
                        let isActive = false

                        // ⭐ FIX: Dashboard active เฉพาะหน้า /dashboard จริง ๆ
                        if (route.href === "/dashboard") {
                            isActive =
                                pathname === "/dashboard" ||
                                pathname === "/dashboard/"
                        } else {
                            // ⭐ FIX: เมนูอื่นรองรับ subroutes เช่น /dashboard/control/abc
                            isActive = pathname.startsWith(route.href)
                        }

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                    "hover:bg-gray-100",
                                    isActive &&
                                        "bg-blue-50 text-blue-700 border border-blue-400 shadow-sm shadow-blue-100"
                                )}
                            >
                                <route.icon
                                    className={cn(
                                        "h-4 w-4",
                                        isActive ? "text-blue-700" : "text-gray-600"
                                    )}
                                />
                                {route.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right Section */}
                <div className="ml-auto flex items-center gap-4">
                    <div className="relative w-64 hidden lg:block">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("search_placeholder")} className="pl-8" />
                    </div>

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full bg-secondary">
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

                            {/* ⭐ ใช้งาน handleLogout ได้แน่นอน */}
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-destructive focus:text-destructive"
                            >
                                {t("logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </header>
    )
}
