import { NextResponse } from "next/server"
import { castVote, getUserVotes } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }
  const votes = await getUserVotes(userId)
  return NextResponse.json({ userId, votes })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string
    targetType?: "concern" | "proposal" | "comment"
    targetId?: string
    value?: 1 | -1
  }
  if (!body.userId || !body.targetType || !body.targetId || (body.value !== 1 && body.value !== -1)) {
    return NextResponse.json(
      { error: "userId, targetType, targetId, value (+1 or -1) are required" },
      { status: 400 }
    )
  }
  const result = await castVote({
    userId: body.userId,
    targetType: body.targetType,
    targetId: body.targetId,
    value: body.value,
  })
  return NextResponse.json(result, { status: result.alreadyVoted ? 200 : 201 })
}
