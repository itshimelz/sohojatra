import { Resend } from "resend"

import { env } from "@/lib/env"

type GlobalWithResend = typeof globalThis & {
  __sohojatraResend?: Resend | null
}

const globalRef = globalThis as GlobalWithResend

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null
  globalRef.__sohojatraResend ??= new Resend(env.RESEND_API_KEY)
  return globalRef.__sohojatraResend
}

function isSyntheticEmail(address: string) {
  return /@sohojatra\.example\.com$/i.test(address)
}

function otpHtml(code: string) {
  return `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111;">
      <h2 style="margin:0 0 12px 0;">Your Sohojatra verification code</h2>
      <p style="margin:0 0 16px 0;color:#444;">Use the code below to confirm your sign-in. It expires in 5 minutes.</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f4f4f5;border-radius:8px;padding:16px;text-align:center;">${code}</p>
      <p style="margin-top:16px;color:#666;font-size:12px;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `
}

/**
 * Sends a verification OTP via email. Safe to call even when the user has no
 * real email on file — it short-circuits for synthetic phone-tempo addresses
 * and falls back to a console log in development when Resend is unconfigured.
 */
export async function sendOtpEmail(to: string, code: string) {
  if (!to || isSyntheticEmail(to)) return

  const resend = getResend()

  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[OTP EMAIL DEV] ${to}: ${code}`)
    }
    return
  }

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Your Sohojatra verification code",
    html: otpHtml(code),
  })

  if (error) {
    throw new Error(
      `Resend API rejected email: ${error.message ?? "unknown error"}`
    )
  }
}
