import { create } from "zustand"
import * as jose from "jose"

export interface AuthUser {
  id: string
  username: string
}

export interface SessionData {
  session_id: string
  account_id: string
  github_username: string
  exp: number
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => Promise<void>
  checkAndSetUserFromToken: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      // Call server to clear the cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      // Update state
      set({ user: null, isAuthenticated: false })

      // Redirect to login
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout failed:", error)
      window.location.href = "/login"
    }
  },

  checkAndSetUserFromToken: () => {
    try {
      // Get token from URL if available
      const urlParams = new URLSearchParams(window.location.search)
      const sessionToken = urlParams.get("session_token")

      if (sessionToken) {
        // Clean URL by removing token
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)

        // Decode and validate token
        const decoded = jose.decodeJwt<SessionData>(sessionToken)

        // Check if token is valid and not expired
        if (decoded && decoded.exp * 1000 > Date.now()) {
          set({
            user: {
              id: decoded.account_id,
              username: decoded.github_username,
            },
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }
      }

      // If no token in URL, user is not logged in
      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch (error) {
      console.error("Failed to validate token:", error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
