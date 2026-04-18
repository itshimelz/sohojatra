/**
 * POST /api/forum/proposals/[id]/comments — Add a comment to a forum proposal.
 *
 * SECURITY:
 *   - Requires authenticated session.
 *   - Author comes from the session, not the request body.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { addProposalComment } from "@/lib/sohojatra/store"

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