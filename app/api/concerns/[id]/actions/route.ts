import { voteOnConcern, downvoteConcern, updateConcernStatus, detectDuplicateConcerns } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  // GET would retrieve a specific concern (handled by main concerns[id] route)
  return Response.json({})
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: concernId } = await params
  const body = await request.json()

  switch (body.action) {
    case "vote": {
      const updated = await voteOnConcern(concernId, body.increment ?? 1)
      if (!updated) {
        return Response.json({ error: "Concern not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "downvote": {
      const updated = await downvoteConcern(concernId, body.increment ?? 1)
      if (!updated) {
        return Response.json({ error: "Concern not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "updateStatus": {
      const updated = await updateConcernStatus(concernId, body.status)
      if (!updated) {
        return Response.json({ error: "Concern not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "detectDuplicates": {
      const duplicates = await detectDuplicateConcerns(concernId, body.threshold ?? 0.8)
      return Response.json(duplicates)
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 })
  }
}
