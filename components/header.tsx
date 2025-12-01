"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bell, Search, User, LayoutDashboard, Thermometer, Clock, CloudSun, Radio, LogOut, BookOpen } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const { t } = useLanguage()

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const routes = [
        {
            label: t("dashboard"),
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: t("control"),
            icon: Thermometer,
            href: "/dashboard/control",
            active: pathname === "/dashboard/control",
        },
        {
            label: t("schedule"),
            icon: Clock,
            href: "/dashboard/schedule",
            active: pathname === "/dashboard/schedule",
        },
        {
            label: t("weather"),
            icon: CloudSun,
            href: "/dashboard/weather",
            active: pathname === "/dashboard/weather",
        },
        {
            label: t("simulator"),
            icon: Radio,
            href: "/dashboard/simulator",
            active: pathname === "/dashboard/simulator",
        },
        {
            label: t("aws_iot"),
            icon: CloudSun, // Keeping CloudSun for AWS IoT as per original Cloud icon
            href: "/dashboard/aws-iot",
            active: pathname === "/dashboard/aws-iot",
        },
        {
            label: t("docs"),
            icon: BookOpen,
            href: "/docs",
            active: pathname === "/docs",
        },
    ]

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 sticky top-0 z-50">
            <div className="flex items-center gap-6 w-full">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    {t("iot_manager")}
                </div>

                <nav className="hidden md:flex items-center gap-1">
                    {routes.map((route) => (
                        <Button
                            key={route.href}
                            variant={route.active ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                                "gap-2",
                                route.active && "bg-secondary"
                            )}
                            asChild
                        >
                            <Link href={route.href}>
                                <route.icon className="h-4 w-4" />
                                {route.label}
                            </Link>
                        </Button>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-4">
                    <div className="relative w-64 hidden lg:block">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("search_placeholder")} className="pl-8" />
                    </div>

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="hidden md:flex gap-2 text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                        {t("logout")}
                    </Button>

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
                                <Link href="/dashboard/profile" className="w-full cursor-pointer">{t("profile")}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="w-full cursor-pointer">{t("settings")}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                {t("logout")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
