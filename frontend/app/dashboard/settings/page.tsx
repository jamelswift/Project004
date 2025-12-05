"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Bell, Moon, Sun, Shield, Key, Globe, Smartphone, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"

export default function SettingsPage() {
    const { setTheme, theme } = useTheme()
    const { language, setLanguage, t } = useLanguage()

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
                <p className="text-muted-foreground">{t("general")}</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">{t("general")}</TabsTrigger>
                    <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
                    <TabsTrigger value="security">{t("security")}</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("general")}</CardTitle>
                            <CardDescription>ปรับแต่งการแสดงผลและภาษา</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Theme</Label>
                                    <p className="text-sm text-muted-foreground">
                                        ปรับเปลี่ยนธีมของแอปพลิเคชัน
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 border rounded-lg p-1">
                                    <Button
                                        variant={theme === "light" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setTheme("light")}
                                    >
                                        <Sun className="h-4 w-4" />
                                        <span className="sr-only">{t("theme_light")}</span>
                                    </Button>
                                    <Button
                                        variant={theme === "dark" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <Moon className="h-4 w-4" />
                                        <span className="sr-only">{t("theme_dark")}</span>
                                    </Button>
                                    <Button
                                        variant={theme === "system" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setTheme("system")}
                                    >
                                        <Monitor className="h-4 w-4" />
                                        <span className="sr-only">{t("theme_system")}</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t("language")}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        เลือกภาษาที่ต้องการใช้งาน
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value as "th" | "en")}
                                    >
                                        <option value="th">ไทย (Thai)</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("notifications")}</CardTitle>
                            <CardDescription>จัดการช่องทางและประเภทการแจ้งเตือน</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <Bell className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-base">การแจ้งเตือนผ่านอีเมล</Label>
                                        <p className="text-sm text-muted-foreground">
                                            รับข่าวสารและรายงานสรุปทางอีเมล
                                        </p>
                                    </div>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <Smartphone className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            แจ้งเตือนทันทีบนหน้าจอ
                                        </p>
                                    </div>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("security")}</CardTitle>
                            <CardDescription>จัดการรหัสผ่านและความปลอดภัยของบัญชี</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>รหัสผ่านปัจจุบัน</Label>
                                    <Input type="password" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>รหัสผ่านใหม่</Label>
                                        <Input type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ยืนยันรหัสผ่านใหม่</Label>
                                        <Input type="password" />
                                    </div>
                                </div>
                                <Button>{t("save")}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
