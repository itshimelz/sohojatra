import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { phoneNumber, admin } from "better-auth/plugins"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { isRateLimited as isRedisRateLimited } from "@/lib/redis"
import { sendOtpEmail } from "@/lib/email"
import {
  ac,
  citizen,
  moderator,
  admin as adminRole,
  superadmin,
} from "@/lib/permissions"

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_WINDOW_SECONDS = 10 * 60
const OTP_MAX_PER_WINDOW = 5
const SMS_OTP_MESSAGE =
  "Your Sohojatra verification code is {code}. It expires in 5 minutes. Do not share this code with anyone."

// In-memory fallback used only when Redis is not configured.
const otpSendStore = new Map<string, { count: number; resetAt: number }>()

// ─── Phone Utilities ──────────────────────────────────────────────────────────

function normalizeBangladeshPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("880")) return digits
  if (digits.startsWith("0")) return `880${digits.slice(1)}`
  return `880${digits}`
}

/** Masks all but the last 4 digits — safe for logs. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `XXXX${digits.slice(-4)}`
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

function getRateLimitKey(phone: string, request: unknown): string {
  try {
    const reqObj = request as any
    const headers = reqObj?.headers ?? reqObj?.request?.headers
    let ip = "unknown"
    if (headers) {
      const fwd =
        typeof headers.get === "function"
          ? headers.get("x-forwarded-for")
          : headers["x-forwarded-for"]
      if (typeof fwd === "string") ip = fwd.split(",")[0].trim()
    }
    return `otp:${ip}:${phone}`
  } catch {
    return `otp:fallback-${Date.now()}:${phone}`
  }
}

function isRateLimitedMemory(key: string): boolean {
  const now = Date.now()
  const bucket = otpSendStore.get(key)
  if (!bucket || now >= bucket.resetAt) {
    otpSendStore.set(key, { count: 1, resetAt: now + OTP_WINDOW_MS })
    return false
  }
  if (bucket.count >= OTP_MAX_PER_WINDOW) return true
  bucket.count += 1
  otpSendStore.set(key, bucket)
  return false
}

async function isRateLimited(key: string): Promise<boolean> {
  try {
    return await isRedisRateLimited(key, OTP_MAX_PER_WINDOW, OTP_WINDOW_SECONDS)
  } catch {
    return isRateLimitedMemory(key)
  }
}

// ─── Channel 2: SMS Delivery ──────────────────────────────────────────────────

async function sendOtpSms(phone: string, code: string): Promise<void> {
  const hasCredentials =
    Boolean(env.SSL_SMS_API_URL && env.SSL_SMS_API_KEY) &&
    !/^(your-|replace-with-)/i.test(env.SSL_SMS_API_KEY ?? "")

  if (!hasCredentials) {
    // No valid credentials configured — dev console log is the only channel.
    return
  }

  const normalizedPhone = normalizeBangladeshPhoneNumber(phone)

  const body = new URLSearchParams({
    api_key: env.SSL_SMS_API_KEY,
    msg: SMS_OTP_MESSAGE.replace("{code}", code),
    to: normalizedPhone,
  })

  const res = await fetch(env.SSL_SMS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  const raw = await res.text()

  if (!res.ok) {
    throw new Error(`SMS API HTTP ${res.status}: ${raw}`)
  }

  let parsed: { error?: number; msg?: string; message?: string; data?: { request_id?: number } } | null = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`SMS API non-JSON response: ${raw}`)
  }

  if (parsed?.error !== 0) {
    const code = parsed?.error
    const detail = parsed?.msg ?? parsed?.message ?? "rejected"
    const hint =
      code === 421 ? " (Recharge account or send to a registered number first)" :
      code === 417 ? " (Insufficient balance)" :
      code === 416 ? " (Invalid phone number)" :
      code === 405 ? " (Invalid API key)" :
      code === 413 ? " (Invalid Sender ID)" : ""
    throw new Error(`SSL SMS error ${code}: ${detail}${hint}`)
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[SMS SENT] to=${normalizedPhone} request_id=${parsed?.data?.request_id ?? "?"}`)
  }
}

// ─── Email Lookup ─────────────────────────────────────────────────────────────

async function resolveUserEmailForPhone(phone: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phone },
      select: { email: true },
    })
    const email = user?.email
    if (!email || /@sohojatra\.example\.com$/i.test(email)) return null
    return email
  } catch {
    return null
  }
}

// ─── Audit Logging ────────────────────────────────────────────────────────────

type OtpChannel = "sms" | "email"
type ChannelStatus = "ok" | "failed" | "skipped"

function logOtpDispatch(
  phone: string,
  results: {
    backend: ChannelStatus
    sms: ChannelStatus
    email: ChannelStatus
  }
): void {
  const line = `[OTP DISPATCH] phone=${maskPhone(phone)} backend=${results.backend} sms=${results.sms} email=${results.email}`
  if (process.env.NODE_ENV === "production") {
    console.info(line)
  } else {
    console.info(line)
  }
}

// ─── sendOTP: All Three Channels ─────────────────────────────────────────────

async function dispatchOtp(phone: string, code: string, ctx: unknown): Promise<void> {
  // ── Channel 1: Backend (dev console — NEVER in production) ──
  let backendStatus: ChannelStatus = "skipped"
  if (process.env.NODE_ENV !== "production") {
    // Safe: dev environment only, never reaches production logs
    console.info(`[OTP DEV] phone=${phone}  code=${code}`)
    backendStatus = "ok"
  }

  // ── Channels 2 & 3: SMS + Email — start both in parallel ────
  //
  // resolveUserEmailForPhone (DB query ~10 ms) and sendOtpSms (HTTP ~500 ms)
  // start simultaneously. Email delivery is chained immediately after the
  // lookup resolves, so in practice SMS and email run concurrently.

  const emailLookup = resolveUserEmailForPhone(phone)
  const smsDelivery = sendOtpSms(phone, code)

  // Chain email delivery right after lookup completes
  const email = await emailLookup
  const emailDelivery: Promise<void> = email
    ? sendOtpEmail(email, code)
    : Promise.resolve()

  // Await both deliveries together
  const [smsResult, emailResult] = await Promise.allSettled([
    smsDelivery,
    emailDelivery,
  ])

  const smsStatus: ChannelStatus =
    smsResult.status === "fulfilled" ? "ok" : "failed"
  const emailStatus: ChannelStatus = !email
    ? "skipped"
    : emailResult.status === "fulfilled"
    ? "ok"
    : "failed"

  logOtpDispatch(phone, { backend: backendStatus, sms: smsStatus, email: emailStatus })

  // ── Failure handling ──────────────────────────────────────────
  if (smsResult.status === "rejected") {
    if (email && emailResult.status === "fulfilled") {
      // SMS failed but email succeeded — user can still verify.
      console.warn(
        `[auth] SMS failed for ${maskPhone(phone)}, email fallback succeeded.`,
        (smsResult as PromiseRejectedResult).reason
      )
      return
    }
    // Both channels failed — throw so Better Auth surfaces an error.
    const smsErr = (smsResult as PromiseRejectedResult).reason
    console.error(`[auth] All OTP channels failed for ${maskPhone(phone)}`, smsErr)
    throw new Error(
      "Failed to send your verification code. Please check your phone number and try again."
    )
  }

  if (emailResult.status === "rejected") {
    // Email failure is non-blocking when SMS succeeded.
    console.warn(
      `[auth] OTP email failed for ${maskPhone(phone)} (non-blocking).`,
      (emailResult as PromiseRejectedResult).reason
    )
  }
}

// ─── Better Auth Configuration ────────────────────────────────────────────────

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }, ctx) => {
        // Rate limit gate — covers all three channels
        const key = getRateLimitKey(phone, ctx)
        if (await isRateLimited(key)) {
          throw new Error("Too many OTP requests. Please wait and try again.")
        }

        await dispatchOtp(phone, code, ctx)
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone}@sohojatra.example.com`,
      },
    }),
    admin({
      defaultRole: "citizen",
      adminRoles: ["admin", "superadmin"],
      ac,
      roles: {
        citizen,
        moderator,
        admin: adminRole,
        superadmin,
      },
    }),
  ],
  user: {
    additionalFields: {
      onboarded: { type: "boolean", defaultValue: false, required: false },
      dob: { type: "date", required: false },
      education: { type: "string", required: false },
    },
  },
})
