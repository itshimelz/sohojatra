import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// ── Rate-limit store (API auth endpoints only) ───────────────
type Bucket = { count: number; resetAt: number }

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const SEND_OTP_LIMIT = 5
const VERIFY_OTP_LIMIT = 20
const DEFAULT_API_LIMIT = 60

const rateLimitStore = new Map<string, Bucket>()

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

function getApiLimit(pathname: string) {
  if (pathname.includes("send-otp")) return SEND_OTP_LIMIT
  if (pathname.includes("verify")) return VERIFY_OTP_LIMIT
  return DEFAULT_API_LIMIT
}

function isRateLimited(key: string, limit: number) {
  const now = Date.now()
  const bucket = rateLimitStore.get(key)

  if (!bucket || now >= bucket.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (bucket.count >= limit) return true

  bucket.count += 1
  rateLimitStore.set(key, bucket)
  return false
}

// ── Route definitions ────────────────────────────────────────

/** Routes that require authentication (optimistic cookie check) */
const protectedPaths = ["/concerns/submit"]

/** Auth pages — redirect away if already logged in */
const authPages = ["/login", "/signup"]

import { betterFetch } from "@better-fetch/fetch"
import type { auth } from "@/lib/auth"

// ── Proxy ─────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rate-limit POST requests to the auth API
  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    const ip = getClientIp(request)
    const limit = getApiLimit(pathname)
    const key = `${ip}:${pathname}`

    if (isRateLimited(key, limit)) {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again in a few minutes.",
        },
        { status: 429, headers: { "Retry-After": "600" } }
      )
    }

    return NextResponse.next()
  }

  // 1.5 Early exit for ALL other API routes to prevent recursive fetches
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // 2. Optimistic session check via cookie
  const sessionCookie = getSessionCookie(request)
  const isAuthPage = authPages.some((p) => pathname === p)
  const isOnboardRoute = pathname === "/onboard"

  // 3. Auth pages — redirect logged-in users away
  if (isAuthPage) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // 4. Force Onboard Check & Protected Routes
  if (sessionCookie) {
    // Only query DB for session if we really need to enforce onboard or access roles
    const { data: session } = await betterFetch<typeof auth.$Infer.Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: { cookie: request.headers.get("cookie") || "" },
      }
    )

    if (session?.user) {
      const isOnboarded = (session.user as any).onboarded

      // Not onboarded? Must go to /onboard
      if (!isOnboarded && !isOnboardRoute) {
        return NextResponse.redirect(new URL("/onboard", request.url))
      }

      // Already onboarded? Must not see /onboard
      if (isOnboarded && isOnboardRoute) {
        return NextResponse.redirect(new URL("/", request.url))
      }
    }
  } else {
    // 5. Unauthenticated user accessing protected path
    if (protectedPaths.some((p) => pathname.startsWith(p)) || isOnboardRoute) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
