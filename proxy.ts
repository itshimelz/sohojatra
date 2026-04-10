import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

type Bucket = {
  count: number
  resetAt: number
}

const WINDOW_MS = 10 * 60 * 1000
const DEFAULT_LIMIT = 60
const SEND_OTP_LIMIT = 5
const VERIFY_OTP_LIMIT = 20

const store = new Map<string, Bucket>()

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (!forwardedFor) {
    return "unknown"
  }

  return forwardedFor.split(",")[0]?.trim() || "unknown"
}

function getLimit(pathname: string) {
  if (pathname.includes("send-otp")) {
    return SEND_OTP_LIMIT
  }

  if (pathname.includes("verify")) {
    return VERIFY_OTP_LIMIT
  }

  return DEFAULT_LIMIT
}

function isLimited(key: string, limit: number) {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (bucket.count >= limit) {
    return true
  }

  bucket.count += 1
  store.set(key, bucket)
  return false
}

export function proxy(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  const ip = getClientIp(request)
  const limit = getLimit(pathname)
  const key = `${ip}:${pathname}`

  if (!isLimited(key, limit)) {
    return NextResponse.next()
  }

  return NextResponse.json(
    {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again in a few minutes.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": "600",
      },
    }
  )
}

export const config = {
  matcher: ["/api/auth/:path*"],
}
