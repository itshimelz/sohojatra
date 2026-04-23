/**
 * GET/POST /api/forum/proposals/[id]/comments — List and add proposal comments.
 *
 * SECURITY:
 *   - GET: Public.
 *   - POST: Requires authenticated session; author comes from session.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { addProposalComment, listProposals } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const proposals = await listProposals()
  const proposal = proposals.find((p) => p.id === id)
  const comments = (proposal?.comments ?? []).map((c) => ({
    id: c.id,
    authorName: c.author,
    body: c.body,
    upvotes: c.points ?? 0,
    downvotes: 0,
    createdAt: c.createdAt,
    quoted: c.quote,
  }))
  return NextResponse.json({ proposalId: id, comments })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth Guard: Must be logged in to comment ─────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const { id } = await params
  const body = await request.json()

  // ── Author from session, not body ────────────────────────
  const comment = await addProposalComment(id, {
    author: session.userName,
    body: body.body,
    quote: body.quote,
  })

  if (!comment) {
    return NextResponse.json(
      { message: "Proposal not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ comment }, { status: 201 })
}