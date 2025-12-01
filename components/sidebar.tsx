"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, Radio, Settings, FileText, Cloud, Thermometer, Calendar, Book } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            active: pathname === "/dashboard",
        },
        {
            label: "Devices",
            icon: Radio,
            href: "/dashboard/devices", // Assuming this route exists or will be created
            active: pathname === "/dashboard/devices",
        },
        {
            label: "Control",
            icon: Thermometer,
            href: "/dashboard/control",
            active: pathname === "/dashboard/control",
        },
        {
            label: "Schedule",
            icon: Calendar,
            href: "/dashboard/schedule",
            active: pathname === "/dashboard/schedule",
        },
        {
            label: "Weather",
            icon: Cloud,
            href: "/dashboard/weather",
            active: pathname === "/dashboard/weather",
        },
        {
            label: "Simulator",
            icon: Book,
            href: "/dashboard/simulator",
            active: pathname === "/dashboard/simulator",
        },
        {
            label: "AWS IoT",
            icon: Cloud,
            href: "/dashboard/aws-iot",
            active: pathname === "/dashboard/aws-iot",
        },
    ]

    return (
        <div className={cn("pb-12 w-64 border-r bg-sidebar h-screen fixed left-0 top-0 hidden md:block", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-foreground">
                        IoT Manager
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start",
                                    route.active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                )}
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-foreground">
                        Settings
                    </h2>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50" asChild>
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50" asChild>
                            <Link href="/docs">
                                <FileText className="mr-2 h-4 w-4" />
                                Documentation
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
