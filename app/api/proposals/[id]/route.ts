/**
 * GET/POST /api/proposals/[id] — View or vote on a specific proposal.
 *
 * SECURITY:
 *   - GET: Public (anyone can view proposals).
 *   - POST (vote/downvote): Requires authenticated session.
 */
import { requireSession } from "@/lib/api-guard"
import {
  listProposals,
  voteOnProposal,
  downvoteProposal,
  type ProposalRecord,
} from "@/lib/sohojatra/store"

// GET is public — anyone can view a proposal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const proposals = await listProposals()
  const proposal = proposals.find((p: ProposalRecord) => p.id === id)

  if (!proposal) {
    return Response.json({ error: "Proposal not found" }, { status: 404 })
  }

  return Response.json(proposal)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth Guard: Must be logged in to vote ────────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const { id } = await params
  const body = await request.json()

  switch (body.action) {
    case "vote": {
      const updated = await voteOnProposal(id, body.increment ?? 1)
      if (!updated) {
        return Response.json({ error: "Proposal not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "downvote": {
      const updated = await downvoteProposal(id, body.increment ?? 1)
      if (!updated) {
        return Response.json({ error: "Proposal not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 })
  }
}
