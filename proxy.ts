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

  // 2. Optimistic session check via cookie
  const sessionCookie = getSessionCookie(request)

  // 3. Auth pages — redirect logged-in users to home
  if (authPages.some((p) => pathname === p)) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // 4. Protected routes — redirect unauthenticated users to login
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Auth API rate-limiting
    "/api/auth/:path*",
    // Auth pages (redirect if logged in)
    "/login",
    "/signup",
    // Protected citizen routes
    "/concerns/submit",
  ],
}
