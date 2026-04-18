/**
 * POST /api/moderation/approve — Approve, reject, or escalate moderation flags.
 *
 * SECURITY:
 *   - GET: Requires moderator, admin, or superadmin role (RBAC).
 *   - POST: Requires moderator, admin, or superadmin role (RBAC).
 *   - The reviewedBy field is set from the session, not the client.
 *   - Citizens cannot access this endpoint at all (403).
 */
import { requireRole } from "@/lib/api-guard"
import {
  listModerationQueue,
  approveModerationFlag,
  rejectModerationFlag,
  escalateModerationFlag,
} from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  // ── RBAC: Only moderator+ can view the moderation queue ──
  const session = await requireRole(request, [
    "moderator",
    "admin",
    "superadmin",
  ])
  if (session instanceof Response) return session

  const queue = await listModerationQueue()
  return Response.json(queue)
}

export async function POST(request: Request) {
  // ── RBAC: Only moderator+ can perform moderation actions ──
  const session = await requireRole(request, [
    "moderator",
    "admin",
    "superadmin",
  ])
  if (session instanceof Response) return session

  const body = await request.json()

  switch (body.action) {
    case "approve": {
      // reviewedBy is taken from the verified session, not the client
      const flag = await approveModerationFlag(body.flagId, session.userName)
      if (!flag) {
        return Response.json({ error: "Flag not found" }, { status: 404 })
      }
      return Response.json(flag)
    }

    case "reject": {
      const flag = await rejectModerationFlag(body.flagId, session.userName)
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
