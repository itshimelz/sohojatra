import { NextResponse } from "next/server"

import { anonymousVerifiedProfile } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  return NextResponse.json({ profile: anonymousVerifiedProfile(body.userId) })
}
