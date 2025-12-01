import type { User } from "@/types"

// Mock users - ในการใช้งานจริงควรใช้ database
export const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "user@wsn.com",
    role: "user",
    name: "ผู้ใช้งานทั่วไป",
  },
  {
    id: "2",
    email: "admin@wsn.com",
    role: "admin",
    name: "ผู้ดูแลระบบ",
  },
]

export function registerUser(
  email: string,
  password: string,
  name: string,
): { success: boolean; message: string; user?: User } {
  // ตรวจสอบว่าอีเมลนี้มีผู้ใช้แล้วหรือไม่
  const existingUser = MOCK_USERS.find((u) => u.email === email)
  if (existingUser) {
    return { success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" }
  }

  // ตรวจสอบความยาวรหัสผ่าน
  if (password.length < 6) {
    return { success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }
  }

  // สร้างผู้ใช้ใหม่
  const newUser: User = {
    id: (MOCK_USERS.length + 1).toString(),
    email,
    role: "user", // ผู้สมัครใหม่จะเป็น user เสมอ
    name,
  }

  // เพิ่มผู้ใช้ใหม่เข้าไปในระบบ
  MOCK_USERS.push(newUser)

  // ในการใช้งานจริง ควรเก็บรหัสผ่านแบบเข้ารหัสลงใน database
  // สำหรับ mock ตอนนี้ เราจะใช้ password123 สำหรับทุกคน

  return { success: true, message: "สมัครสมาชิกสำเร็จ", user: newUser }
}

export function authenticateUser(email: string, password: string): User | null {
  // Mock authentication - รหัสผ่านคือ "password123"
  if (password === "password123") {
    const user = MOCK_USERS.find((u) => u.email === email)
    if (user) {
      return user
    }

    // If user not found in mock list, allow login as a new user
    return {
      id: "temp-" + Date.now(),
      email: email,
      role: "user",
      name: email.split("@")[0], // Use part of email as name
    }
  }
  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("currentUser")
  if (!userStr) return null

  return JSON.parse(userStr)
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
  } else {
    localStorage.removeItem("currentUser")
  }
}

export function logout() {
  setCurrentUser(null)
}
