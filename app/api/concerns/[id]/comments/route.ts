/**
 * POST /api/concerns/[id]/comments — Add a comment to a concern.
 *
 * SECURITY:
 *   - Requires authenticated session for POST (401 if missing).
 *   - Author name and ID are extracted from the session, preventing spoofing.
 *   - GET is public — anyone can read comments.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { addConcernComment, listConcernComments } from "@/lib/sohojatra/store"

// GET is public — anyone can view comments
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: concernId } = await params
  const comments = await listConcernComments(concernId)
  return NextResponse.json({ concernId, comments })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth Guard: Reject unauthenticated users ─────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const { id: concernId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    body?: string
    quoted?: string
    parentCommentId?: string
  }

  if (!body.body) {
    return NextResponse.json(
      { error: "body is required" },
      { status: 400 }
    )
  }

  // ── Identity from session, NOT body ──────────────────────
  const comment = await addConcernComment({
    concernId,
    authorName: session.userName,
    authorId: session.userId,
    body: body.body,
    quoted: body.quoted,
    parentCommentId: body.parentCommentId,
  })

  if (!comment) {
    return NextResponse.json({ error: "Concern not found" }, { status: 404 })
  }

  // Fire-and-forget: send comment text to AI for training feedback collection
  const railwayUrl = process.env.RAILWAY_AI_URL
  if (railwayUrl && body.body) {
    void fetch(`${railwayUrl}/collect-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: comment.id, text: body.body }),
    }).catch(() => undefined)
  }

  return NextResponse.json({ comment }, { status: 201 })
}
