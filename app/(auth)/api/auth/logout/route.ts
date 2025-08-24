import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()

  // Clear the session token cookie from the server
  cookieStore.delete("session_token")

  // Return a response with cleared cookie instructions for the browser
  const response = NextResponse.json({ success: true })

  // Set an expired cookie in the response as well (belt and suspenders approach)
  response.cookies.set({
    name: "session_token",
    value: "",
    expires: new Date(0),
    path: "/",
  })

  return response
}
