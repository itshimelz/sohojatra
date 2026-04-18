/**
 * POST /api/security/trust-score — Compute a trust score for a device.
 *
 * SECURITY:
 *   - Requires authenticated session. Trust scoring is a per-user
 *     security feature and should not be callable anonymously.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { trustFromFingerprint } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  // ── Auth: Must be logged in ──────────────────────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    fingerprint?: string
    ip?: string
    recentFailures?: number
    velocity?: number
  }

  if (!body.fingerprint) {
    return NextResponse.json(
      { error: "fingerprint is required" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    result: trustFromFingerprint({
      fingerprint: body.fingerprint,
      ip: body.ip,
      recentFailures: body.recentFailures,
      velocity: body.velocity,
    }),
  })
}
