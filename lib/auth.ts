import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { phoneNumber, admin } from "better-auth/plugins"
import { prisma } from "@/lib/prisma"
import {
  ac,
  citizen,
  moderator,
  admin as adminRole,
  superadmin,
} from "@/lib/permissions"

const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_MAX_PER_WINDOW = 5

const otpSendStore = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(phoneNumber: string, request: unknown) {
  const headers =
    request && typeof request === "object" && "headers" in request
      ? (request as { headers?: Headers }).headers
      : undefined
  const forwardedFor = headers?.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"
  return `${ip}:${phoneNumber}`
}

function isRateLimited(key: string) {
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

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber }, ctx) => {
        const key = getRateLimitKey(phoneNumber, ctx)
        if (isRateLimited(key)) {
          throw new Error("Too many OTP requests. Please try again later.")
        }

        // TODO: Integrate an SMS provider to deliver OTP.
        // Never log OTP values or auth secrets.
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
