import type { User } from "@/types"

// API base URL - use environment variable or current origin for API calls
const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '') 
  : 'http://localhost:5000'

function mapUser(raw: any): User {
  return {
    id: raw?.userId || raw?.id || raw?.email,
    email: raw?.email || "",
    role: (raw?.role as User["role"]) || "user",
    name: raw?.name || raw?.email?.split("@")?.[0] || "",
  }
}

function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
  } else {
    localStorage.removeItem("currentUser")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("currentUser")
  if (!userStr) return null
  try {
    return JSON.parse(userStr) as User
  } catch (error) {
    localStorage.removeItem("currentUser")
    return null
  }
}

export async function registerUser(email: string, password: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, name }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "ไม่สามารถสมัครสมาชิกได้")
  }

  const user = mapUser(data.user)
  setCurrentUser(user)
  return { user, accessToken: data.accessToken as string | undefined }
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "ไม่สามารถเข้าสู่ระบบได้")
  }

  const user = mapUser(data.user)
  setCurrentUser(user)
  return { user, accessToken: data.accessToken as string | undefined }
}

export async function refreshTokens() {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "ไม่สามารถรีเฟรช token ได้")
  }

  const user = mapUser(data.user)
  setCurrentUser(user)
  return { user, accessToken: data.accessToken as string | undefined }
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    setCurrentUser(null)
    return null
  }

  const data = await response.json()
  const user = mapUser(data.user)
  setCurrentUser(user)
  return user
}

export async function ensureCurrentUser() {
  const cached = getCurrentUser()
  if (cached) return cached
  return fetchCurrentUser()
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch (error) {
    console.error("Logout request failed", error)
  } finally {
    setCurrentUser(null)
  }
}

export { setCurrentUser }
