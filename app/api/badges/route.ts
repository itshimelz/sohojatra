import { NextResponse } from "next/server"

import { awardBadge, getUserBadges, BADGE_CATALOG } from "@/lib/sohojatra/store"

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
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string
    badgeKey?: string
    label?: string
    description?: string
  }

  if (!body.userId || !body.badgeKey) {
    return NextResponse.json({ error: "userId and badgeKey are required" }, { status: 400 })
  }

  const result = await awardBadge({
    userId: body.userId,
    badgeKey: body.badgeKey,
    label: body.label,
    description: body.description,
  })

  return NextResponse.json(result, { status: result.alreadyHeld ? 200 : 201 })
}
