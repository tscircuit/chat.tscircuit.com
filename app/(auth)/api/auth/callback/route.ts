import { NextRequest, NextResponse } from "next/server"
import * as jose from "jose"
import { getOrCreateGithubUser, getUser } from "@/lib/db/queries"
import type { User } from "@/lib/db/schema"

// Secret for signing JWT tokens - should be environment variable in production
const JWT_SECRET =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "production"
    ? "production_missing_secret"
    : "dev_secret_do_not_use_in_production")

export async function GET(request: NextRequest) {
  // Get session token from various sources
  const sessionToken = getSessionToken(request)

  if (!sessionToken) {
    console.error("No session token found in callback URL or cookies")
    return NextResponse.redirect(
      new URL("/login?error=missing_token", request.url),
    )
  }

  // Decode the token from tscircuit
  let decoded: jose.JWTPayload
  try {
    decoded = jose.decodeJwt(sessionToken)
  } catch (tokenError) {
    console.error("Failed to decode token:", tokenError)
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url),
    )
  }

  // Extract github_username and email from decoded token
  const github_username = decoded.github_username as string
  const email = decoded.email as string
  const account_id = decoded.account_id as string

  if (!github_username) {
    console.error("No github_username in decoded token")
    return NextResponse.redirect(
      new URL("/login?error=missing_github_username", request.url),
    )
  }

  if (!email) {
    console.error("No email in decoded token")
    return NextResponse.redirect(
      new URL("/login?error=missing_email", request.url),
    )
  }

  // Try to find or create the user
  let user: User
  try {
    // First try to find user by email
    const existingUsers = await getUser({ email })

    if (existingUsers && existingUsers.length > 0) {
      user = existingUsers[0]
    } else {
      // Create user if not found
      user = await getOrCreateGithubUser(github_username, email)
    }
  } catch (error) {
    console.error("Failed to get or create user:", error)
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error),
    )
    return NextResponse.redirect(
      new URL("/login?error=user_creation_failed", request.url),
    )
  }

  // Create our own session JWT
  let ourSessionToken: string
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const session_id = crypto.randomUUID()

    ourSessionToken = await new jose.SignJWT({
      session_id,
      id: user.id,
      account_id,
      github_username,
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret)
  } catch (jwtError) {
    console.error("Failed to create session token:", jwtError)
    return NextResponse.redirect(
      new URL("/login?error=session_creation_failed", request.url),
    )
  }

  // Create redirect response
  const redirectUrl = new URL("/", request.url)
  const response = NextResponse.redirect(redirectUrl)

  // Set session cookie in the response
  response.cookies.set({
    name: "session_token",
    value: ourSessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}

// Helper function to get session token from various sources
function getSessionToken(request: NextRequest): string | null {
  // First try query params
  let sessionToken = request.nextUrl.searchParams.get("session_token")
  if (sessionToken) return sessionToken

  // Then try cookies
  const cookieSessionToken = request.cookies.get("session_token")?.value
  if (cookieSessionToken) {
    try {
      // Verify the user exists in our database
      const decoded = jose.decodeJwt(cookieSessionToken)
      const email = decoded.email as string
      const github_username = decoded.github_username as string

      if (email) {
        // Async operation wrapped in try/catch but not awaited
        // as we're just checking the cookie, not using the result here
        ;(async () => {
          try {
            const existingUsers = await getUser({ email })
            if (!existingUsers || existingUsers.length === 0) {
              if (github_username) {
                await getOrCreateGithubUser(github_username, email)
              }
            }
          } catch (error) {
            console.error("Error verifying user from cookie:", error)
          }
        })()
      }
    } catch (error) {
      console.error("Error processing cookie token:", error)
    }

    return cookieSessionToken
  }

  // Finally try referrer
  const referrer = request.headers.get("referer")
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer)
      sessionToken = referrerUrl.searchParams.get("session_token")
      if (sessionToken) return sessionToken
    } catch (e) {
      console.error("Failed to parse referrer URL:", e)
    }
  }

  return null
}
