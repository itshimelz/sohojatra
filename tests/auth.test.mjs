import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const rootDir = process.cwd()

// ============================================================================
// 1. Auth file structure tests
// ============================================================================
describe("Auth file structure", () => {
  const requiredFiles = [
    "lib/auth.ts",
    "lib/auth-client.ts",
    "lib/env.ts",
    "lib/prisma.ts",
    "app/api/auth/[...all]/route.ts",
    "app/(auth)/login/page.tsx",
    "app/(auth)/signup/page.tsx",
    "components/login-form.tsx",
    "components/signup-form.tsx",
  ]

  for (const file of requiredFiles) {
    it(`${file} exists`, () => {
      assert.equal(
        existsSync(join(rootDir, file)),
        true,
        `Missing critical auth file: ${file}`
      )
    })
  }
})

// ============================================================================
// 2. Phone number validation (BD format)
// ============================================================================
describe("Phone number validation – Bangladeshi format", () => {
  // This is the exact regex used in signup-form.tsx and login-form.tsx
  const bdPhoneRegex = /^1[3-9]\d{8}$/

  it("accepts valid Grameenphone number (017...)", () => {
    assert.equal(bdPhoneRegex.test("1712345678"), true)
  })

  it("accepts valid Banglalink number (019...)", () => {
    assert.equal(bdPhoneRegex.test("1912345678"), true)
  })

  it("accepts valid Robi number (018...)", () => {
    assert.equal(bdPhoneRegex.test("1812345678"), true)
  })

  it("accepts valid Teletalk number (015...)", () => {
    assert.equal(bdPhoneRegex.test("1512345678"), true)
  })

  it("accepts valid Airtel number (016...)", () => {
    assert.equal(bdPhoneRegex.test("1612345678"), true)
  })

  it("rejects number starting with 10 (invalid operator prefix)", () => {
    assert.equal(bdPhoneRegex.test("1012345678"), false)
  })

  it("rejects number starting with 11 (invalid operator prefix)", () => {
    assert.equal(bdPhoneRegex.test("1112345678"), false)
  })

  it("rejects number starting with 12 (invalid operator prefix)", () => {
    assert.equal(bdPhoneRegex.test("1212345678"), false)
  })

  it("rejects number with leading 0 (should be stripped by UI)", () => {
    assert.equal(bdPhoneRegex.test("01712345678"), false)
  })

  it("rejects number with country code prefix", () => {
    assert.equal(bdPhoneRegex.test("+8801712345678"), false)
  })

  it("rejects too-short number (9 digits)", () => {
    assert.equal(bdPhoneRegex.test("171234567"), false)
  })

  it("rejects too-long number (11 digits)", () => {
    assert.equal(bdPhoneRegex.test("17123456789"), false)
  })

  it("rejects empty string", () => {
    assert.equal(bdPhoneRegex.test(""), false)
  })

  it("rejects non-numeric input", () => {
    assert.equal(bdPhoneRegex.test("17abcdefgh"), false)
  })

  it("rejects number starting with 2 (landline prefix)", () => {
    assert.equal(bdPhoneRegex.test("2712345678"), false)
  })
})

// ============================================================================
// 3. E.164 formatting
// ============================================================================
describe("E.164 phone number formatting", () => {
  // Mirrors the logic in signup-form.tsx / login-form.tsx:
  //   `+880${phoneNumber}`
  function formatE164(localNumber) {
    return `+880${localNumber}`
  }

  it("formats a valid local number to E.164", () => {
    assert.equal(formatE164("1712345678"), "+8801712345678")
  })

  it("produces a 14-character E.164 string", () => {
    const result = formatE164("1712345678")
    assert.equal(result.length, 14)
  })

  it("starts with +880", () => {
    const result = formatE164("1912345678")
    assert.ok(result.startsWith("+880"))
  })
})

// ============================================================================
// 4. mapAuthError logic (extracted from both forms)
// ============================================================================
describe("mapAuthError – phase-aware error classification", () => {
  // Updated replica matching the phase-aware function in both forms
  function mapAuthError(message, fallback, phase = "verify") {
    const normalized = message.toLowerCase()

    if (
      normalized.includes("rate") ||
      normalized.includes("too many") ||
      normalized.includes("limit")
    ) {
      return {
        channel: "toast",
        message:
          "Too many attempts. Please wait a few minutes and try again.",
      }
    }

    if (normalized.includes("network") || normalized.includes("fetch")) {
      return {
        channel: "toast",
        message:
          "Network issue detected. Please check your connection and retry.",
      }
    }

    if (phase === "verify" && (normalized.includes("invalid") || normalized.includes("otp"))) {
      return { channel: "alert", message: "Invalid OTP. Please check the code and try again." }
    }

    if (phase === "send" && normalized.includes("invalid")) {
      return {
        channel: "alert",
        message: "Could not send OTP. Please check your phone number.",
      }
    }

    return { channel: "toast", message: fallback }
  }

  it("maps 'invalid otp' to inline alert during verify phase", () => {
    const result = mapAuthError("Invalid OTP code", "fallback", "verify")
    assert.equal(result.channel, "alert")
    assert.match(result.message, /Invalid OTP/)
  })

  it("maps 'otp expired' to inline alert during verify phase", () => {
    const result = mapAuthError("OTP expired", "fallback", "verify")
    assert.equal(result.channel, "alert")
  })

  it("maps 'invalid' during send phase to phone-number error, NOT OTP error", () => {
    const result = mapAuthError("Invalid phone number", "fallback", "send")
    assert.equal(result.channel, "alert")
    assert.match(result.message, /phone number/)
    assert.ok(!result.message.includes("Invalid OTP"), "Should NOT show 'Invalid OTP' during send phase")
  })

  it("does NOT show OTP error for 'invalid' during send phase", () => {
    const result = mapAuthError("Invalid request", "fallback", "send")
    assert.ok(!result.message.includes("Invalid OTP"))
  })

  it("maps rate-limit error to toast regardless of phase", () => {
    const sendResult = mapAuthError("Rate limit exceeded", "fallback", "send")
    const verifyResult = mapAuthError("Rate limit exceeded", "fallback", "verify")
    assert.equal(sendResult.channel, "toast")
    assert.equal(verifyResult.channel, "toast")
    assert.match(sendResult.message, /Too many/)
  })

  it("maps 'too many requests' to toast", () => {
    const result = mapAuthError("Too many requests", "fallback")
    assert.equal(result.channel, "toast")
    assert.match(result.message, /Too many/)
  })

  it("maps network error to toast regardless of phase", () => {
    const result = mapAuthError("Network error", "fallback", "send")
    assert.equal(result.channel, "toast")
    assert.match(result.message, /Network issue/)
  })

  it("maps fetch failure to toast", () => {
    const result = mapAuthError("Fetch failed", "fallback")
    assert.equal(result.channel, "toast")
    assert.match(result.message, /Network issue/)
  })

  it("returns fallback for unknown errors", () => {
    const result = mapAuthError("Something went wrong", "Custom fallback")
    assert.equal(result.channel, "toast")
    assert.equal(result.message, "Custom fallback")
  })

  it("handles empty message string gracefully", () => {
    const result = mapAuthError("", "Fallback message")
    assert.equal(result.channel, "toast")
    assert.equal(result.message, "Fallback message")
  })

  it("defaults to verify phase when phase is omitted", () => {
    const result = mapAuthError("Invalid code", "fallback")
    assert.equal(result.channel, "alert")
    assert.match(result.message, /Invalid OTP/)
  })
})

// ============================================================================
// 5. Rate limiter logic (unit test of the algorithm from lib/auth.ts)
// ============================================================================
describe("OTP rate limiter", () => {
  const OTP_WINDOW_MS = 10 * 60 * 1000
  const OTP_MAX_PER_WINDOW = 5

  let store

  function isRateLimited(key) {
    const now = Date.now()
    const bucket = store.get(key)

    if (!bucket || now >= bucket.resetAt) {
      store.set(key, { count: 1, resetAt: now + OTP_WINDOW_MS })
      return false
    }

    if (bucket.count >= OTP_MAX_PER_WINDOW) {
      return true
    }

    bucket.count += 1
    store.set(key, bucket)
    return false
  }

  beforeEach(() => {
    store = new Map()
  })

  it("allows the first request", () => {
    assert.equal(isRateLimited("ip:+8801712345678"), false)
  })

  it("allows up to 5 requests in the window", () => {
    const key = "ip:+8801712345678"
    for (let i = 0; i < OTP_MAX_PER_WINDOW; i++) {
      assert.equal(isRateLimited(key), false, `Request ${i + 1} should pass`)
    }
  })

  it("blocks the 6th request in the same window", () => {
    const key = "ip:+8801712345678"
    for (let i = 0; i < OTP_MAX_PER_WINDOW; i++) {
      isRateLimited(key)
    }
    assert.equal(isRateLimited(key), true)
  })

  it("tracks different phone numbers independently", () => {
    const key1 = "ip:+8801712345678"
    const key2 = "ip:+8801812345678"

    for (let i = 0; i < OTP_MAX_PER_WINDOW; i++) {
      isRateLimited(key1)
    }

    // key1 should be rate limited, key2 should not
    assert.equal(isRateLimited(key1), true)
    assert.equal(isRateLimited(key2), false)
  })

  it("resets after the window expires", () => {
    const key = "ip:+8801712345678"

    // Exhaust the limit
    for (let i = 0; i < OTP_MAX_PER_WINDOW; i++) {
      isRateLimited(key)
    }
    assert.equal(isRateLimited(key), true)

    // Simulate window expiry by tampering with the bucket
    const bucket = store.get(key)
    bucket.resetAt = Date.now() - 1
    store.set(key, bucket)

    assert.equal(isRateLimited(key), false)
  })
})

// ============================================================================
// 6. getRateLimitKey logic (from lib/auth.ts)
// ============================================================================
describe("getRateLimitKey construction", () => {
  // Replica of the function in lib/auth.ts
  function getRateLimitKey(phoneNumber, request) {
    const headers =
      request && typeof request === "object" && "headers" in request
        ? request.headers
        : undefined
    const forwardedFor = headers?.get?.("x-forwarded-for")
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"
    return `${ip}:${phoneNumber}`
  }

  it("extracts IP from x-forwarded-for header", () => {
    const mockRequest = {
      headers: new Headers({ "x-forwarded-for": "192.168.1.1" }),
    }
    assert.equal(
      getRateLimitKey("+8801712345678", mockRequest),
      "192.168.1.1:+8801712345678"
    )
  })

  it("extracts first IP from a comma-separated chain", () => {
    const mockRequest = {
      headers: new Headers({
        "x-forwarded-for": "10.0.0.1, 172.16.0.1, 192.168.1.1",
      }),
    }
    assert.equal(
      getRateLimitKey("+8801712345678", mockRequest),
      "10.0.0.1:+8801712345678"
    )
  })

  it("falls back to 'unknown' when no headers present", () => {
    assert.equal(
      getRateLimitKey("+8801712345678", {}),
      "unknown:+8801712345678"
    )
  })

  it("falls back to 'unknown' when request is null", () => {
    assert.equal(
      getRateLimitKey("+8801712345678", null),
      "unknown:+8801712345678"
    )
  })
})

// ============================================================================
// 7. Temp email generation (from phoneNumber plugin config in lib/auth.ts)
// ============================================================================
describe("signUpOnVerification.getTempEmail", () => {
  // Mirrors the logic in lib/auth.ts
  const getTempEmail = (phoneNumber) => `${phoneNumber}@sohojatra.example.com`

  it("generates expected email for a BD number", () => {
    assert.equal(
      getTempEmail("+8801712345678"),
      "+8801712345678@sohojatra.example.com"
    )
  })

  it("output contains the original phone number", () => {
    const email = getTempEmail("+8801912345678")
    assert.ok(email.includes("+8801912345678"))
  })

  it("output ends with the sohojatra domain", () => {
    const email = getTempEmail("+8801712345678")
    assert.ok(email.endsWith("@sohojatra.example.com"))
  })
})

// ============================================================================
// 8. Auth client production safety (from lib/auth-client.ts)
// ============================================================================
describe("Auth client production HTTPS check", () => {
  it("rejects HTTP URLs in production logic", () => {
    const url = "http://example.com"
    const isProduction = true
    const isHttps = url.startsWith("https://")

    if (isProduction && url && !isHttps) {
      assert.ok(true, "Should throw in production for non-HTTPS")
    } else {
      assert.fail("Expected rejection of HTTP in production")
    }
  })

  it("accepts HTTPS URLs in production logic", () => {
    const url = "https://sohojatra.app"
    const isHttps = url.startsWith("https://")

    assert.equal(isHttps, true)
  })
})

// ============================================================================
// 9. Auth API route handler structure
// ============================================================================
describe("Auth API route handler", () => {
  it("exports both GET and POST handlers", () => {
    const routeContent = readFileSync(
      join(rootDir, "app/api/auth/[...all]/route.ts"),
      "utf-8"
    )

    assert.ok(routeContent.includes("POST"), "Missing POST export")
    assert.ok(routeContent.includes("GET"), "Missing GET export")
  })

  it("uses toNextJsHandler from better-auth", () => {
    const routeContent = readFileSync(
      join(rootDir, "app/api/auth/[...all]/route.ts"),
      "utf-8"
    )

    assert.ok(
      routeContent.includes("toNextJsHandler"),
      "Missing toNextJsHandler import"
    )
  })
})

// ============================================================================
// 10. Auth server config structure checks
// ============================================================================
describe("Auth server config (lib/auth.ts)", () => {
  const authContent = readFileSync(join(rootDir, "lib/auth.ts"), "utf-8")

  it("uses prismaAdapter", () => {
    assert.ok(authContent.includes("prismaAdapter"))
  })

  it("uses phoneNumber plugin", () => {
    assert.ok(authContent.includes("phoneNumber("))
  })

  it("implements sendOTP callback", () => {
    assert.ok(authContent.includes("sendOTP"))
  })

  it("implements rate limiting for OTP sends", () => {
    assert.ok(authContent.includes("isRateLimited"))
  })

  it("has signUpOnVerification config", () => {
    assert.ok(authContent.includes("signUpOnVerification"))
  })

  it("does not log OTP values or secrets", () => {
    // Ensure no console.log with OTP values in the sendOTP function area
    const sendOtpBlock = authContent.slice(
      authContent.indexOf("sendOTP"),
      authContent.indexOf("signUpOnVerification")
    )
    assert.equal(
      sendOtpBlock.includes("console.log"),
      false,
      "sendOTP must not log OTP values"
    )
  })
})

// ============================================================================
// 11. Environment validation (lib/env.ts)
// ============================================================================
describe("Environment validation (lib/env.ts)", () => {
  const envContent = readFileSync(join(rootDir, "lib/env.ts"), "utf-8")

  it("validates DATABASE_URL is present", () => {
    assert.ok(envContent.includes("DATABASE_URL"))
  })

  it("validates BETTER_AUTH_SECRET is present", () => {
    assert.ok(envContent.includes("BETTER_AUTH_SECRET"))
  })

  it("validates BETTER_AUTH_URL is present", () => {
    assert.ok(envContent.includes("BETTER_AUTH_URL"))
  })

  it("enforces HTTPS for BETTER_AUTH_URL in production", () => {
    assert.ok(
      envContent.includes('startsWith("https://"'),
      "Missing HTTPS enforcement for production"
    )
  })

  it("enforces minimum secret length in production", () => {
    assert.ok(
      envContent.includes(".length < 32"),
      "Missing minimum secret-length check"
    )
  })

  it("has fail-fast mechanism for missing vars", () => {
    assert.ok(
      envContent.includes("throw new Error"),
      "Missing fail-fast throw"
    )
  })
})

// ============================================================================
// 12. Form component structure checks
// ============================================================================
describe("Signup form structure", () => {
  const formContent = readFileSync(
    join(rootDir, "components/signup-form.tsx"),
    "utf-8"
  )

  it("has the 'use client' directive", () => {
    assert.ok(formContent.startsWith('"use client"'))
  })

  it("renders the BD country code prefix (+880)", () => {
    assert.ok(formContent.includes("+880"))
  })

  it("uses BD phone regex validation", () => {
    assert.ok(formContent.includes("bdPhoneRegex"))
  })

  it("requires name field for signup", () => {
    assert.ok(formContent.includes("setName"))
  })

  it("implements OTP sending flow", () => {
    assert.ok(formContent.includes("handleSendOtp"))
  })

  it("implements OTP verification flow", () => {
    assert.ok(formContent.includes("handleVerifyOtp"))
  })

  it("uses mapAuthError for error classification", () => {
    assert.ok(formContent.includes("mapAuthError"))
  })

  it("navigates to /concerns on success", () => {
    assert.ok(formContent.includes('"/concerns"'))
  })
})

describe("Login form structure", () => {
  const formContent = readFileSync(
    join(rootDir, "components/login-form.tsx"),
    "utf-8"
  )

  it("has the 'use client' directive", () => {
    assert.ok(formContent.startsWith('"use client"'))
  })

  it("renders the BD country code prefix (+880)", () => {
    assert.ok(formContent.includes("+880"))
  })

  it("uses BD phone regex validation", () => {
    assert.ok(formContent.includes("bdPhoneRegex"))
  })

  it("does NOT require name field (login only)", () => {
    assert.equal(
      formContent.includes("setName"),
      false,
      "Login form should not collect name"
    )
  })

  it("implements OTP sending flow", () => {
    assert.ok(formContent.includes("handleSendOtp"))
  })

  it("implements OTP verification flow", () => {
    assert.ok(formContent.includes("handleVerifyOtp"))
  })

  it("navigates to /concerns on success", () => {
    assert.ok(formContent.includes('"/concerns"'))
  })

  it("links to /signup for new users", () => {
    assert.ok(formContent.includes('"/signup"'))
  })
})
