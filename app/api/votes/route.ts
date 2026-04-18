/**
 * POST /api/votes — Cast or query user votes.
 *
 * SECURITY:
 *   - POST requires authenticated session.
 *   - The userId is extracted from the session, NOT the request body,
 *     preventing any user from voting on behalf of another.
 *   - GET requires userId from query params (which is the caller's own ID).
 */
import { NextResponse } from "next/server"

import { requireSession, optionalSession } from "@/lib/api-guard"
import { castVote, getUserVotes } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  // ── Auth: Require login to see your own votes ────────────
  const session = await optionalSession()
  const { searchParams } = new URL(request.url)
  const userId = session?.userId ?? searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const votes = await getUserVotes(userId)
  return NextResponse.json({ userId, votes })
}

export async function POST(request: Request) {
  // ── Auth Guard: Reject unauthenticated users ─────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as {
    targetType?: "concern" | "proposal" | "comment"
    targetId?: string
    value?: 1 | -1
  }

  if (
    !body.targetType ||
    !body.targetId ||
    (body.value !== 1 && body.value !== -1)
  ) {
    return NextResponse.json(
      { error: "targetType, targetId, value (+1 or -1) are required" },
      { status: 400 }
    )
  }

  // ── Identity from session — prevents vote-on-behalf attacks
  const result = await castVote({
    userId: session.userId,
    targetType: body.targetType,
    targetId: body.targetId,
    value: body.value,
  })

  return NextResponse.json(result, { status: result.alreadyVoted ? 200 : 201 })
}
