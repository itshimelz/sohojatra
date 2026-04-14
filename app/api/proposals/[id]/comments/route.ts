import { addProposalComment, voteOnComment, downvoteComment } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  _params: { params: Promise<{ id: string }> }
) {
  // GET comments endpoint would list comments for a proposal
  return Response.json([])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params
  const body = await request.json()

  switch (body.action) {
    case "create": {
      const comment = await addProposalComment(proposalId, {
        author: body.author || "Anonymous",
        body: body.body,
        quote: body.quote,
      })
      if (!comment) {
        return Response.json({ error: "Proposal not found" }, { status: 404 })
      }
      return Response.json(comment, { status: 201 })
    }

    case "vote": {
      const comment = await voteOnComment(proposalId, body.commentId, body.increment ?? 1)
      if (!comment) {
        return Response.json({ error: "Comment or proposal not found" }, { status: 404 })
      }
      return Response.json(comment)
    }

    case "downvote": {
      const comment = await downvoteComment(proposalId, body.commentId, body.increment ?? 1)
      if (!comment) {
        return Response.json({ error: "Comment or proposal not found" }, { status: 404 })
      }
      return Response.json(comment)
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 })
  }
}
