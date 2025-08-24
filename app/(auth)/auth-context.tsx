"use client"

import { createContext, useContext, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "./auth-store"
import type { AuthUser } from "./auth-store"

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const {
    user,
    isLoading,
    isAuthenticated,
    logout: storeLogout,
    checkAndSetUserFromToken,
  } = useAuthStore()

  // Check for session token and set user on mount
  useEffect(() => {
    checkAndSetUserFromToken()
  }, [checkAndSetUserFromToken])

  // Wrap the store's logout to include router navigation
  const logout = () => {
    storeLogout()
    router.push("/login")
  }

  const value = {
    user,
    isLoading,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
