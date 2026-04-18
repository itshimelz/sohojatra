/**
 * POST /api/verification/nid — Verify a national ID number.
 *
 * SECURITY:
 *   - Requires authenticated session. The NID is associated with
 *     the logged-in user's account, not a publicly accessible endpoint.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { verifyNid } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  // ── Auth: Must be logged in to verify NID ────────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = (await request.json()) as { nid?: string }
  if (!body.nid) {
    return NextResponse.json({ error: "nid is required" }, { status: 400 })
  }

  return NextResponse.json({ verification: verifyNid(body.nid) })
}
