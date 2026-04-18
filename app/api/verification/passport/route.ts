/**
 * POST /api/verification/passport — Verify a passport number.
 *
 * SECURITY:
 *   - Requires authenticated session. Passport verification is tied
 *     to the logged-in user's identity, not publicly accessible.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { verifyPassport } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  // ── Auth: Must be logged in to verify passport ───────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    passport?: string
    country?: string
  }
  if (!body.passport) {
    return NextResponse.json(
      { error: "passport is required" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    verification: verifyPassport(body.passport, body.country ?? "BD"),
  })
}
