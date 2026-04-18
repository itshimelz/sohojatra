/**
 * POST /api/reputation — Award reputation points to a user.
 *
 * SECURITY:
 *   - GET: Requires authenticated session (you can view your own reputation).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only administrators can manually award reputation points.
 *     Automated reputation awards should go through the store layer directly.
 */
import { NextResponse } from "next/server"

import { requireSession, requireRole } from "@/lib/api-guard"
import { awardReputation, getUserReputation } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  // ── Auth: Must be logged in to view reputation ───────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  // Users can only query their own reputation via the session
  const reputation = await getUserReputation(session.userId)
  return NextResponse.json(reputation)
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can manually award reputation ──────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as {
    userId?: string
    reason?: string
    delta?: number
  }

  if (!body.userId || !body.reason) {
    return NextResponse.json(
      { error: "userId and reason are required" },
      { status: 400 }
    )
  }

  const event = await awardReputation({
    userId: body.userId,
    reason: body.reason,
    delta: body.delta,
  })
  return NextResponse.json({ event }, { status: 201 })
}
