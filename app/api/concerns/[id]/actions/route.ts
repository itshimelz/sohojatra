/**
 * POST /api/concerns/[id]/actions — Perform actions on a concern.
 *
 * SECURITY:
 *   - vote / downvote: Requires authenticated session (citizen+).
 *   - updateStatus: Requires moderator, admin, or superadmin role (RBAC).
 *   - detectDuplicates: Requires moderator+ role.
 *   - Identity is extracted from session — no client-supplied userId.
 */
import { requireSession, requireRole } from "@/lib/api-guard"
import {
  voteOnConcern,
  downvoteConcern,
  updateConcernStatus,
  detectDuplicateConcerns,
} from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
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
      // ── Auth: Any authenticated citizen can vote ──────────
      const session = await requireSession(request)
      if (session instanceof Response) return session

      const updated = await voteOnConcern(concernId, body.increment ?? 1)
      if (!updated) {
        return Response.json({ error: "Concern not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "downvote": {
      // ── Auth: Any authenticated citizen can downvote ──────
      const session = await requireSession(request)
      if (session instanceof Response) return session

      const updated = await downvoteConcern(concernId, body.increment ?? 1)
      if (!updated) {
        return Response.json({ error: "Concern not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "updateStatus": {
      // ── RBAC: Only moderator+ can change concern status ──
      const session = await requireRole(request, [
        "moderator",
        "admin",
        "superadmin",
      ])
      if (session instanceof Response) return session

      const updated = await updateConcernStatus(concernId, body.status)
      if (!updated) {
        return Response.json({ error: "Concern not found" }, { status: 404 })
      }
      return Response.json(updated)
    }

    case "detectDuplicates": {
      // ── RBAC: Only moderator+ can run duplicate detection ─
      const session = await requireRole(request, [
        "moderator",
        "admin",
        "superadmin",
      ])
      if (session instanceof Response) return session

      const duplicates = await detectDuplicateConcerns(
        concernId,
        body.threshold ?? 0.8
      )
      return Response.json(duplicates)
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 })
  }
}
