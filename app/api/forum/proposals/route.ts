/**
 * GET/POST /api/forum/proposals — Forum proposals listing and creation.
 *
 * SECURITY:
 *   - GET: Public (proposals are viewable by anyone).
 *   - POST: Requires authenticated session.
 *     Author identity comes from the session, not the body.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { createProposal, listProposals } from "@/lib/sohojatra/store"
import type { ProposalRecord } from "@/lib/sohojatra/store"

// GET is public — proposals are open for reading
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get("sort") ?? "trending"
  const proposals = await listProposals()

  const sorted = proposals
    .slice()
    .sort((left: ProposalRecord, right: ProposalRecord) => {
      if (sort === "new") {
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        )
      }

      if (sort === "controversial") {
        const leftControversy = Math.abs(left.votes - left.downvotes)
        const rightControversy = Math.abs(right.votes - right.downvotes)
        return leftControversy - rightControversy
      }

      return right.votes - left.votes
    })

  return NextResponse.json({ proposals: sorted, sort })
}

export async function POST(request: Request) {
  // ── Auth Guard: Must be logged in to create proposals ────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = await request.json()

  // ── Author from session, not the client body ─────────────
  const proposal = await createProposal({
    title: body.title,
    body: body.body,
    author: session.userName,
    category: body.category,
  })

  return NextResponse.json({ proposal }, { status: 201 })
}