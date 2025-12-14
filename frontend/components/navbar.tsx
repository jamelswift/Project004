"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Thermometer,
  Clock,
  Cloud,
  Radio,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const menu = [
    { name: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
    { name: "ควบคุม", href: "/dashboard/control", icon: Thermometer },
    { name: "ตั้งเวลา", href: "/dashboard/schedule", icon: Clock },
    { name: "สภาพอากาศ", href: "/dashboard/weather", icon: Cloud },
    { name: "จำลองเซ็นเซอร์", href: "/dashboard/simulator", icon: Radio },
    { name: "aws_iot", href: "/dashboard/aws_iot", icon: Cloud },
    { name: "คู่มือ", href: "/docs", icon: Book },
  ];

  return (
    <nav className="w-full border-b bg-white px-6 py-3 flex items-center gap-8">
      <div className="text-xl font-bold text-blue-600">iot_manager</div>

      <div className="flex items-center gap-3">
        {menu.map((item) => {
          const Icon = item.icon;

          // ตรวจ active แบบรองรับ sub path เช่น /dashboard/control/device/123
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100",
                isActive &&
                  "bg-blue-50 border border-blue-400 text-blue-700 shadow-md shadow-blue-100"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-blue-700" : "text-gray-500"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
