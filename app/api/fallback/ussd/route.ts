/**
 * POST /api/fallback/ussd — USSD fallback for feature phone users.
 *
 * SECURITY:
 *   - This endpoint is PUBLIC by design. USSD sessions come from
 *     the telecom gateway and cannot carry browser session cookies.
 *
 *   - Rate-limiting is enforced at the proxy/middleware layer.
 *
 *   NOTE: In production, validate the USSD gateway webhook origin
 *   (e.g., IP allowlist or signature verification).
 */
import { NextResponse } from "next/server"

import { ussdReply } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; text?: string }
  if (!body.phone) {
    return NextResponse.json(
      { error: "phone is required" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    reply: ussdReply({ phone: body.phone, text: body.text ?? "" }),
  })
}
