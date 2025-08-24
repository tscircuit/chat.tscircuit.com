import { create } from "zustand"
import * as jose from "jose"

export interface AuthUser {
  id: string
  github_username: string
  email: string
}

export interface SessionData {
  id: string // Database-generated ID
  session_id: string
  account_id: string
  github_username: string
  email: string
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
          // Store token in cookie to ensure server and client stay in sync
          document.cookie = `session_token=${sessionToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

          // Set user data from token - prioritize id over account_id
          set({
            user: {
              id: decoded.id || decoded.account_id, // Use database ID, fall back to account_id
              github_username: decoded.github_username,
              email: decoded.email,
            },
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }
      }

      // If no token in URL, try to get it from cookies
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("session_token="))
        ?.split("=")[1]

      if (cookieToken) {
        try {
          const decoded = jose.decodeJwt<SessionData>(cookieToken)

          // Check if token is valid and not expired
          if (decoded && decoded.exp * 1000 > Date.now()) {
            set({
              user: {
                id: decoded.id || decoded.account_id, // Use database ID, fall back to account_id
                github_username: decoded.github_username,
                email: decoded.email,
              },
              isAuthenticated: true,
              isLoading: false,
            })
            return
          }
        } catch (error) {
          console.error("Failed to parse cookie token:", error)
        }
      }

      // If no valid token found, user is not logged in
      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch (error) {
      console.error("Failed to validate token:", error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
