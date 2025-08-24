import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import * as jose from "jose"
import type { SessionData } from "./auth-store"
import { getUser } from "@/lib/db/queries"

export interface AuthUser {
  id: string
  github_username: string
  email: string
}

export interface Session {
  user: AuthUser | null
}

// Function to get the current session from cookies (for server components)
export async function getSession(): Promise<Session> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    return { user: null }
  }

  try {
    const decoded = jose.decodeJwt<SessionData>(sessionToken)

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return { user: null }
    }

    // Get user ID from token - prioritize id field over account_id (for backward compatibility)
    const userId = decoded.id || decoded.account_id

    // Verify the user exists in the database with this ID
    const users = await getUser({ id: userId })

    // If user doesn't exist in the database by ID, try by email or username
    if (!users || users.length === 0) {
      // Try to find by email
      const emailUsers = await getUser({ email: decoded.email })
      if (emailUsers && emailUsers.length > 0) {
        return {
          user: {
            id: emailUsers[0].id,
            github_username: decoded.github_username,
            email: decoded.email,
          },
        }
      }

      // Try to find by GitHub username
      const githubUsers = await getUser({
        github_username: decoded.github_username,
      })
      if (githubUsers && githubUsers.length > 0) {
        return {
          user: {
            id: githubUsers[0].id,
            github_username: decoded.github_username,
            email: decoded.email,
          },
        }
      }

      console.error(`User not found in database for token with ID: ${userId}`)
      return { user: null }
    }

    return {
      user: {
        id: users[0].id,
        github_username: decoded.github_username,
        email: decoded.email,
      },
    }
  } catch (error) {
    console.error("Invalid session token:", error)
    return { user: null }
  }
}

// Middleware-like function to protect routes
export async function requireAuth() {
  const session = await getSession()

  if (!session.user) {
    redirect("/login")
  }

  return session
}
