"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "th" | "en"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const translations = {
    th: {
        "dashboard": "แดชบอร์ด",
        "control": "ควบคุม",
        "schedule": "ตั้งเวลา",
        "weather": "สภาพอากาศ",
        "simulator": "จำลองเซ็นเซอร์",
        "docs": "คู่มือ",
        "settings": "ตั้งค่า",
        "profile": "โปรไฟล์",
        "logout": "ออกจากระบบ",
        "search": "ค้นหา...",
        "notifications": "การแจ้งเตือน",
        "my_account": "บัญชีของฉัน",
        "theme_dark": "โหมดมืด",
        "theme_light": "โหมดสว่าง",
        "theme_system": "ระบบ",
        "language": "ภาษา",
        "general": "ทั่วไป",
        "security": "ความปลอดภัย",
        "save": "บันทึก",
        "cancel": "ยกเลิก",
        "user_role": "ผู้ใช้งานทั่วไป",
        "admin_role": "ผู้ดูแลระบบ",
    },
    en: {
        "dashboard": "Dashboard",
        "control": "Control",
        "schedule": "Schedule",
        "weather": "Weather",
        "simulator": "Virtual Sensor Simulator",
        "docs": "Docs",
        "settings": "Settings",
        "profile": "Profile",
        "logout": "Logout",
        "search": "Search...",
        "notifications": "Notifications",
        "my_account": "My Account",
        "theme_dark": "Dark Mode",
        "theme_light": "Light Mode",
        "theme_system": "System",
        "language": "Language",
        "general": "General",
        "security": "Security",
        "save": "Save",
        "cancel": "Cancel",
        "user_role": "User",
        "admin_role": "Admin",
    }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("th")

    useEffect(() => {
        const savedLang = localStorage.getItem("language") as Language
        if (savedLang) {
            setLanguage(savedLang)
        }
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem("language", lang)
    }

    const t = (key: string) => {
        return translations[language][key as keyof typeof translations["th"]] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
