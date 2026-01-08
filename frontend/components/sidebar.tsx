"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, Radio, Settings, FileText, Cloud, Thermometer, Clock, Book, Bell, Cpu } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "แดชบอร์ด",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard" || pathname === "/dashboard/",
        },
        {
            label: "อุปกรณ์",
            icon: Radio,
            href: "/dashboard/devices",
            active: pathname.startsWith("/dashboard/devices"),
        },
        {
            label: "ระบบควบคุม",
            icon: Cpu,
            href: "/dashboard/system",
            active: pathname.startsWith("/dashboard/system") || pathname.startsWith("/dashboard/control"),
        },
        {
            label: "การแจ้งเตือน",
            icon: Bell,
            href: "/dashboard/alerts",
            active: pathname.startsWith("/dashboard/alerts"),
        },
        {
            label: "การตั้งเวลา",
            icon: Clock,
            href: "/dashboard/schedule",
            active: pathname.startsWith("/dashboard/schedule"),
        },
        {
            label: "สภาพอากาศ",
            icon: Cloud,
            href: "/dashboard/weather",
            active: pathname.startsWith("/dashboard/weather"),
        },
        {
            label: "จำลองระบบ",
            icon: Book,
            href: "/dashboard/simulator",
            active: pathname.startsWith("/dashboard/simulator"),
        },
        {
            label: "AWS IoT",
            icon: Cloud,
            href: "/dashboard/aws-iot",
            active: pathname === "/dashboard/aws-iot",
        },
    ]

    return (
        <div className={cn("pb-6 w-64 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 h-screen fixed left-0 top-0 hidden md:flex md:flex-col shadow-xl z-50", className)}>
            <div className="flex-1 flex flex-col space-y-6 py-6">
                <div className="px-4">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text text-transparent">I</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                IoT Manager
                            </h2>
                            <p className="text-xs text-blue-200">ระบบจัดการ IoT</p>
                        </div>
                    </div>
                    <div className="space-y-2 px-3">
                        {routes.map((route) => (
                            <Link key={route.href} href={route.href}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3.5 px-4 py-3 transition-all duration-300 ease-in-out rounded-full",
                                        route.active 
                                            ? "bg-white/95 text-blue-700 shadow-lg font-bold scale-[1.02]" 
                                            : "text-blue-50 hover:bg-white/10 hover:text-white font-medium hover:scale-[1.01]"
                                    )}
                                >
                                    <route.icon className={cn(
                                        "h-5 w-5 transition-all duration-300 flex-shrink-0",
                                        route.active ? "text-blue-700" : "text-blue-200"
                                    )} />
                                    <span className={cn(
                                        "text-[14px] transition-all duration-300",
                                        route.active ? "tracking-wide" : ""
                                    )}>
                                        {route.label}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="px-4 mt-auto pt-6">
                    <div className="h-px bg-white/20 mb-5"></div>
                    <div className="space-y-2 px-3">
                        <Link href="/dashboard/settings">
                            <div className="flex items-center gap-3.5 px-4 py-3 text-blue-50 hover:bg-white/10 hover:text-white hover:scale-[1.01] rounded-full transition-all duration-300 ease-in-out font-medium">
                                <Settings className="h-5 w-5 text-blue-200 flex-shrink-0" />
                                <span className="text-[14px]">ตั้งค่า</span>
                            </div>
                        </Link>
                        <Link href="/docs">
                            <div className="flex items-center gap-3.5 px-4 py-3 text-blue-50 hover:bg-white/10 hover:text-white hover:scale-[1.01] rounded-full transition-all duration-300 ease-in-out font-medium">
                                <FileText className="h-5 w-5 text-blue-200 flex-shrink-0" />
                                <span className="text-[14px]">เอกสาร</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
