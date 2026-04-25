import "server-only"

import { cookies } from "next/headers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { env } from "@/lib/env"

type SessionPayload = {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
    phoneNumber?: string | null
    onboarded?: boolean | null
  }
}

async function resolveServerBaseUrl(): Promise<string | null> {
  // Prefer request-aware host/proto in deployed environments (Vercel, proxies).
  // This avoids hard dependency on BETTER_AUTH_URL being perfectly configured.
  const hdrs = await headers()
  const forwardedHost = hdrs.get("x-forwarded-host")
  const host = forwardedHost ?? hdrs.get("host")

  if (host) {
    const proto = hdrs.get("x-forwarded-proto") ?? "https"
    return `${proto}://${host}`
  }

  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL
  }

  return null
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const baseUrl = await resolveServerBaseUrl()

  if (!baseUrl) {
    return null
  }

  const cookieHeader = (await cookies()).toString()

  if (!cookieHeader) {
    return null
  }

  const response = await fetch(
    new URL("/api/auth/get-session", baseUrl),
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
export async function requireServerSession(): Promise<
  SessionPayload & { user: NonNullable<SessionPayload["user"]> }
> {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }
  return session as SessionPayload & {
    user: NonNullable<SessionPayload["user"]>
  }
}
