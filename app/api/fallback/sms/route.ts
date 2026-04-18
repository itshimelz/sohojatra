/**
 * POST /api/fallback/sms — SMS fallback for feature phone users.
 *
 * SECURITY:
 *   - This endpoint is PUBLIC by design. Feature phone users cannot
 *     authenticate via browser sessions. Instead, the phone number
 *     itself acts as the identity, and the upstream SMS gateway
 *     validates the sender.
 *
 *   - Rate-limiting is enforced at the proxy/middleware layer to
 *     prevent abuse.
 *
 *   NOTE: In production, this endpoint should validate the request
 *   origin (e.g., SMS gateway webhook signature) to ensure it's
 *   actually coming from the telecom provider.
 */
import { NextResponse } from "next/server"

import { smsFallback } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; message?: string }
  if (!body.phone || !body.message) {
    return NextResponse.json(
      { error: "phone and message are required" },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { sms: smsFallback({ phone: body.phone, message: body.message }) },
    { status: 201 }
  )
}
