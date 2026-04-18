import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// ── Rate-limit store (in-memory, per-process) ────────────────
type Bucket = { count: number; resetAt: number }

// Rate-limit windows
const AUTH_WINDOW_MS = 10 * 60 * 1000   // 10 minutes for auth endpoints
const API_WINDOW_MS = 1 * 60 * 1000     // 1 minute for general API endpoints

// Rate-limit thresholds
const SEND_OTP_LIMIT = 5                 // 5 OTP sends per 10 minutes
const VERIFY_OTP_LIMIT = 20              // 20 OTP verifications per 10 minutes
const DEFAULT_AUTH_LIMIT = 60            // 60 auth requests per 10 minutes
const API_POST_LIMIT = 30               // 30 POST requests per minute to any /api/* route
const API_GET_LIMIT = 120               // 120 GET requests per minute to any /api/* route

const rateLimitStore = new Map<string, Bucket>()

/**
 * Extract the client's IP address from the request headers.
 * Falls back to "unknown" if no forwarding header is present.
 */
function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

/**
 * Determine the rate-limit ceiling for a given auth API pathname.
 */
function getAuthLimit(pathname: string) {
  if (pathname.includes("send-otp")) return SEND_OTP_LIMIT
  if (pathname.includes("verify")) return VERIFY_OTP_LIMIT
  return DEFAULT_AUTH_LIMIT
}

/**
 * Check and update the rate-limit bucket for a given key.
 * Returns true if the request should be rejected (limit exceeded).
 */
function isRateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = rateLimitStore.get(key)

  if (!bucket || now >= bucket.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (bucket.count >= limit) return true

  bucket.count += 1
  rateLimitStore.set(key, bucket)
  return false
}

/**
 * Build a 429 Too Many Requests response with a Retry-After header.
 */
function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again in a few minutes.",
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  )
}

// ── Route definitions ────────────────────────────────────────

/** Routes that require authentication (optimistic cookie check) */
const protectedPaths = ["/concerns/submit"]

/** Auth pages — redirect away if already logged in */
const authPages = ["/login", "/signup"]

// ── Proxy ─────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  // ─────────────────────────────────────────────────────────────
  // 1. Rate-limit ALL /api/* routes (auth + business logic)
  //    This prevents unauthenticated flooding and DDoS on any
  //    API endpoint, not just the auth endpoints.
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Auth API gets its own stricter rate-limiting window
    if (pathname.startsWith("/api/auth") && request.method === "POST") {
      const limit = getAuthLimit(pathname)
      const key = `auth:${ip}:${pathname}`

      if (isRateLimited(key, limit, AUTH_WINDOW_MS)) {
        return tooManyRequests(600) // Retry after 10 minutes
      }

      return NextResponse.next()
    }

    // General API POST rate-limiting — prevents spam submissions
    if (request.method === "POST") {
      const key = `api-post:${ip}`

      if (isRateLimited(key, API_POST_LIMIT, API_WINDOW_MS)) {
        return tooManyRequests(60) // Retry after 1 minute
      }
    }

    // General API GET rate-limiting — prevents scraping / abuse
    if (request.method === "GET") {
      const key = `api-get:${ip}`

      if (isRateLimited(key, API_GET_LIMIT, API_WINDOW_MS)) {
        return tooManyRequests(60)
      }
    }

    return NextResponse.next()
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Optimistic session check via cookie (for page navigation)
  // ─────────────────────────────────────────────────────────────
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
    // All business logic APIs — rate limiting + session enforcement
    "/api/:path*",
    // Auth pages (redirect if logged in)
    "/login",
    "/signup",
    // Protected citizen routes
    "/concerns/submit",
  ],
}
