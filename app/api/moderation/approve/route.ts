import {
  listModerationQueue,
  approveModerationFlag,
  rejectModerationFlag,
  escalateModerationFlag,
} from "@/lib/nagarik/store"

export async function GET() {
  const queue = await listModerationQueue()
  return Response.json(queue)
}

export async function POST(request: Request) {
  const body = await request.json()

  switch (body.action) {
    case "approve": {
      const flag = await approveModerationFlag(body.flagId, body.reviewedBy || "Admin")
      if (!flag) {
        return Response.json({ error: "Flag not found" }, { status: 404 })
      }
      return Response.json(flag)
    }

    case "reject": {
      const flag = await rejectModerationFlag(body.flagId, body.reviewedBy || "Admin")
      if (!flag) {
        return Response.json({ error: "Flag not found" }, { status: 404 })
      }
      return Response.json(flag)
    }

    case "escalate": {
      const flag = await escalateModerationFlag(body.flagId)
      if (!flag) {
        return Response.json({ error: "Flag not found" }, { status: 404 })
      }
      return Response.json(flag)
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 })
  }
}
