/**
 * POST /api/badges — Award badges to a user.
 *
 * SECURITY:
 *   - GET: Public (badge catalog and user badges are viewable).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only administrators can award badges to users.
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { awardBadge, getUserBadges, BADGE_CATALOG } from "@/lib/sohojatra/store"

// GET is public — anyone can view badge catalog or user badges
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const catalog = searchParams.get("catalog")

  if (catalog === "true" || !userId) {
    return NextResponse.json({ catalog: [...BADGE_CATALOG] })
  }

  const badges = await getUserBadges(userId)
  return NextResponse.json({ userId, badges })
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can award badges ───────────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as {
    userId?: string
    badgeKey?: string
    label?: string
    description?: string
  }

  if (!body.userId || !body.badgeKey) {
    return NextResponse.json(
      { error: "userId and badgeKey are required" },
      { status: 400 }
    )
  }

  const result = await awardBadge({
    userId: body.userId,
    badgeKey: body.badgeKey,
    label: body.label,
    description: body.description,
  })

  return NextResponse.json(result, { status: result.alreadyHeld ? 200 : 201 })
}
