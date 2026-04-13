import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

type SessionPayload = {
  user?: {
    id: string
    phoneNumber?: string | null
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  if (!env.BETTER_AUTH_URL) {
    return null
  }

  const cookieHeader = (await cookies()).toString()

  if (!cookieHeader) {
    return null
  }

  const response = await fetch(
    new URL("/api/auth/get-session", env.BETTER_AUTH_URL),
    {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as SessionPayload | null
  return payload
}

/**
 * Require an authenticated session. Redirects to /login if not authenticated.
 */
export async function requireServerSession() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}
