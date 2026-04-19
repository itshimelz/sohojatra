import { Resend } from "resend"

import { env } from "@/lib/env"

type GlobalWithResend = typeof globalThis & {
  __sohojatraResend?: Resend | null
}

const globalRef = globalThis as GlobalWithResend

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY || /^(your-|replace-with-)/i.test(env.RESEND_API_KEY)) {
    return null
  }
  globalRef.__sohojatraResend ??= new Resend(env.RESEND_API_KEY)
  return globalRef.__sohojatraResend
}

function isSyntheticEmail(address: string): boolean {
  return /@sohojatra\.example\.com$/i.test(address)
}

function otpHtml(code: string): string {
  const digits = code.split("").join("&thinsp;")
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
        <tr><td>
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">Sohojatra</p>
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#111827;">Your verification code</h1>
          <p style="margin:0 0 24px 0;font-size:15px;color:#374151;">
            Use the code below to complete your sign-in. It expires in <strong>5 minutes</strong>.
          </p>

          <!-- OTP code block -->
          <div style="background:#f3f4f6;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#111827;font-variant-numeric:tabular-nums;">${digits}</span>
          </div>

          <p style="margin:0;font-size:13px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px;">
            If you did not request this code, you can safely ignore this email.
            Never share your OTP with anyone — Sohojatra will never ask for it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Sends a one-time verification code via email.
 *
 * Safe to call unconditionally — returns early for synthetic addresses
 * and in dev when Resend is unconfigured. Throws on real API errors so
 * the caller can decide whether the failure is blocking.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!to || isSyntheticEmail(to)) return

  const resend = getResend()

  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[OTP EMAIL DEV] to=${to}  code=${code}`)
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
    throw new Error(`Resend rejected OTP email: ${error.message ?? "unknown"}`)
  }
}
