/**
 * GET/POST /api/solution-plans/[id] — View or review a solution plan.
 *
 * SECURITY:
 *   - GET: Public (transparency).
 *   - POST (approve/reject/requestRevision/assignDepartment):
 *     Requires admin or superadmin role. Only government authorities
 *     can review and approve solution plans.
 *     actorName is derived from the session.
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { getSolutionPlan, reviewSolutionPlan } from "@/lib/sohojatra/store"

// GET is public — transparency for solution plans
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const plan = await getSolutionPlan(id)
  if (!plan) {
    return NextResponse.json(
      { error: "Solution plan not found" },
      { status: 404 }
    )
  }
  return NextResponse.json({ plan })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── RBAC: Only admin+ can review solution plans ──────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const { id: planId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "reject" | "requestRevision" | "assignDepartment"
    department?: string
    comments?: string
    notifyUserId?: string
  }

  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 })
  }

  // ── actorName from session, not client ───────────────────
  const updated = await reviewSolutionPlan({
    planId,
    action: body.action,
    actorName: session.userName,
    department: body.department,
    comments: body.comments,
    notifyUserId: body.notifyUserId,
  })

  if (!updated) {
    return NextResponse.json(
      { error: "Solution plan not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ plan: updated })
}
