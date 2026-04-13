import { NextResponse } from "next/server"

import { addBadge, listBadges } from "@/lib/sohojatra/advanced"

export async function GET() {
  return NextResponse.json({ badges: listBadges() })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    key?: string
    label?: string
    description?: string
    awardedTo?: string
  }

  if (!body.key || !body.label || !body.awardedTo) {
    return NextResponse.json({ error: "key, label, and awardedTo are required" }, { status: 400 })
  }

  const badge = addBadge({
    key: body.key,
    label: body.label,
    description: body.description ?? "Achievement unlocked",
    awardedTo: body.awardedTo,
  })

  return NextResponse.json({ badge }, { status: 201 })
}
