import { NextResponse } from "next/server"
import { awardReputation, getUserReputation } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }
  const reputation = await getUserReputation(userId)
  return NextResponse.json(reputation)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string
    reason?: string
    delta?: number
  }
  if (!body.userId || !body.reason) {
    return NextResponse.json({ error: "userId and reason are required" }, { status: 400 })
  }
  const event = await awardReputation({ userId: body.userId, reason: body.reason, delta: body.delta })
  return NextResponse.json({ event }, { status: 201 })
}
