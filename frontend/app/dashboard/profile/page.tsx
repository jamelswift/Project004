"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Building, Calendar, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        department: "",
    })

    // Load data from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem("userProfile")
        if (savedProfile) {
            setFormData(JSON.parse(savedProfile))
        } else {
            // Default initial data if nothing saved
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                department: "",
            })
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }))
    }

    const handleSave = async () => {
        setLoading(true)

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Save to localStorage
        localStorage.setItem("userProfile", JSON.stringify(formData))

        setLoading(false)
        toast.success("บันทึกข้อมูลเรียบร้อยแล้ว", {
            description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัพเดทแล้ว (Local Storage)",
        })
    }

    const handleCancel = () => {
        // Reload from localStorage to reset changes
        const savedProfile = localStorage.getItem("userProfile")
        if (savedProfile) {
            setFormData(JSON.parse(savedProfile))
        }
        toast.info("ยกเลิกการเปลี่ยนแปลงแล้ว")
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("profile")}</h1>
                <p className="text-muted-foreground">จัดการข้อมูลส่วนตัวและบัญชีผู้ใช้</p>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Profile Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>รูปโปรไฟล์</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                            <AvatarImage src="/placeholder-user.jpg" alt="User" />
                            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                                {formData.firstName ? formData.firstName[0].toUpperCase() : "U"}
                                {formData.lastName ? formData.lastName[0].toUpperCase() : "N"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold">
                                {formData.firstName} {formData.lastName}
                            </h2>
                            <p className="text-sm text-muted-foreground">{t("user_role")}</p>
                        </div>
                        <div className="w-full pt-4">
                            <Button variant="outline" className="w-full">
                                อัพโหลดรูปภาพ
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>เข้าร่วมเมื่อ: 1 มกราคม 2024</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="md:col-span-5">
                    <CardHeader>
                        <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                        <CardDescription>แก้ไขข้อมูลส่วนตัวของคุณ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">ชื่อจริง</Label>
                                <div className="relative">
                                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="firstName"
                                        placeholder="ชื่อจริง"
                                        className="pl-8"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">นามสกุล</Label>
                                <div className="relative">
                                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="lastName"
                                        placeholder="นามสกุล"
                                        className="pl-8"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">อีเมล</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        className="pl-8"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                                <div className="relative">
                                    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="เบอร์โทรศัพท์"
                                        className="pl-8"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">ที่อยู่</Label>
                            <div className="relative">
                                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="address"
                                    placeholder="ที่อยู่"
                                    className="pl-8"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">แผนก/หน่วยงาน</Label>
                            <div className="relative">
                                <Building className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="department"
                                    placeholder="แผนก/หน่วยงาน"
                                    className="pl-8"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button variant="ghost" onClick={handleCancel} disabled={loading}>
                                {t("cancel")}
                            </Button>
                            <Button onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
