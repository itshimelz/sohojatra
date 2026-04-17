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

const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_WINDOW_SECONDS = 10 * 60
const OTP_MAX_PER_WINDOW = 5
const SMS_OTP_MESSAGE =
  "Your Sohojatra verification code is {code}. It expires in 5 minutes."

// In-memory fallback used only when Redis is not configured.
const otpSendStore = new Map<string, { count: number; resetAt: number }>()

function normalizeBangladeshPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "")

  if (digits.startsWith("880")) {
    return digits
  }

  if (digits.startsWith("0")) {
    return `880${digits.slice(1)}`
  }

  return `880${digits}`
}

async function sendOtpSms(phoneNumber: string, code: string) {
  const hasRealSmsCredentials =
    Boolean(env.SSL_SMS_API_URL && env.SSL_SMS_API_KEY) &&
    !/^(your-|replace-with-)/i.test(env.SSL_SMS_API_KEY)

  if (process.env.NODE_ENV !== "production" && !hasRealSmsCredentials) {
    console.info(`[OTP DEV] ${phoneNumber}: ${code}`)
    return
  }

  if (!env.SSL_SMS_API_URL || !env.SSL_SMS_API_KEY) {
    throw new Error("SMS API is not configured")
  }

  const smsMessage = SMS_OTP_MESSAGE.replace("{code}", code)
  const requestBody = new URLSearchParams({
    api_key: env.SSL_SMS_API_KEY,
    msg: smsMessage,
    to: normalizeBangladeshPhoneNumber(phoneNumber),
  })

  const response = await fetch(env.SSL_SMS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: requestBody.toString(),
  })

  const rawResponse = await response.text()

  if (!response.ok) {
    throw new Error(
      `SMS API request failed with status ${response.status}: ${rawResponse}`
    )
  }

  let parsedResponse: { error?: number; msg?: string; message?: string } | null = null

  try {
    parsedResponse = JSON.parse(rawResponse) as {
      error?: number
      msg?: string
      message?: string
    }
  } catch {
    throw new Error(`SMS API returned an invalid response: ${rawResponse}`)
  }

  if (parsedResponse?.error && parsedResponse.error !== 0) {
    throw new Error(
      parsedResponse.msg ?? parsedResponse.message ?? "SMS API rejected the request"
    )
  }
}

function getRateLimitKey(phoneNumber: string, request: unknown) {
  const headers =
    request && typeof request === "object" && "headers" in request
      ? (request as { headers?: Headers }).headers
      : undefined
  const forwardedFor = headers?.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"
  return `${ip}:${phoneNumber}`
}

function isRateLimitedMemory(key: string) {
  const now = Date.now()
  const bucket = otpSendStore.get(key)

  if (!bucket || now >= bucket.resetAt) {
    otpSendStore.set(key, { count: 1, resetAt: now + OTP_WINDOW_MS })
    return false
  }

  if (bucket.count >= OTP_MAX_PER_WINDOW) {
    return true
  }

  bucket.count += 1
  otpSendStore.set(key, bucket)
  return false
}

async function isRateLimited(key: string) {
  try {
    return await isRedisRateLimited(key, OTP_MAX_PER_WINDOW, OTP_WINDOW_SECONDS)
  } catch (err) {
    console.warn("[auth] redis rate-limit check failed, falling back", err)
    return isRateLimitedMemory(key)
  }
}

async function resolveUserEmailForPhone(phoneNumber: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { email: true },
    })
    const email = user?.email
    if (!email) return null
    if (/@sohojatra\.example\.com$/i.test(email)) return null
    return email
  } catch (err) {
    console.warn("[auth] failed to look up user email for OTP email", err)
    return null
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, ctx) => {
        const key = getRateLimitKey(phoneNumber, ctx)
        if (await isRateLimited(key)) {
          throw new Error("Too many OTP requests. Please try again later.")
        }

        await sendOtpSms(phoneNumber, code)

        const email = await resolveUserEmailForPhone(phoneNumber)
        if (email) {
          try {
            await sendOtpEmail(email, code)
          } catch (err) {
            // Email is best-effort — SMS has already succeeded.
            console.warn("[auth] failed to send OTP email", err)
          }
        }
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber}@sohojatra.example.com`,
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
})
