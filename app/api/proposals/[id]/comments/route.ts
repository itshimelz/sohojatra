/**
 * POST /api/proposals/[id]/comments — Add or vote on proposal comments.
 *
 * SECURITY:
 *   - GET: Public.
 *   - POST (create/vote/downvote): Requires authenticated session.
 *   - Author name comes from session, not the client body.
 */
import { requireSession } from "@/lib/api-guard"
import {
  addProposalComment,
  voteOnComment,
  downvoteComment,
} from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return Response.json([])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth Guard: Must be logged in to interact with comments
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const { id: proposalId } = await params
  const body = await request.json()

  switch (body.action) {
    case "create": {
      // ── Author comes from session, not "body.author" ─────
      const comment = await addProposalComment(proposalId, {
        author: session.userName,
        body: body.body,
        quote: body.quote,
      })
      if (!comment) {
        return Response.json({ error: "Proposal not found" }, { status: 404 })
      }
      return Response.json(comment, { status: 201 })
    }

    case "vote": {
      const comment = await voteOnComment(
        proposalId,
        body.commentId,
        body.increment ?? 1
      )
      if (!comment) {
        return Response.json(
          { error: "Comment or proposal not found" },
          { status: 404 }
        )
      }
      return Response.json(comment)
    }

    case "downvote": {
      const comment = await downvoteComment(
        proposalId,
        body.commentId,
        body.increment ?? 1
      )
      if (!comment) {
        return Response.json(
          { error: "Comment or proposal not found" },
          { status: 404 }
        )
      }
      return Response.json(comment)
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 })
  }
}
