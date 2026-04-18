/**
 * POST /api/projects/[id]/actions — Project management actions.
 *
 * SECURITY:
 *   - toggleFollow: Requires authenticated session (any citizen).
 *     followerId is taken from the session.
 *   - comment: Requires authenticated session (*author* from session).
 *   - milestone: Requires admin+ role (RBAC) — government action.
 *   - update: Requires admin+ role (RBAC) — government action.
 */
import { NextResponse } from "next/server"

import { requireSession, requireRole } from "@/lib/api-guard"
import {
  addProjectComment,
  addProjectUpdate,
  toggleProjectFollow,
  updateProjectMilestone,
} from "@/lib/sohojatra/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    action?: "toggleFollow" | "comment" | "milestone" | "update"
    milestoneId?: string
    status?: "Planned" | "InProgress" | "SubmittedForVerification" | "Verified"
    verify?: boolean
    text?: string
    comment?: string
    photos?: string[]
    videos?: string[]
    budgetSpentDeltaBdt?: number
  }

  if (body.action === "toggleFollow") {
    // ── Auth: Any citizen can follow/unfollow ───────────────
    const session = await requireSession(request)
    if (session instanceof Response) return session

    // followerId from session, not body
    const result = await toggleProjectFollow({
      projectId,
      followerId: session.userId,
    })
    if (!result)
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    return NextResponse.json(result)
  }

  if (body.action === "comment") {
    // ── Auth: Any citizen can comment ───────────────────────
    const session = await requireSession(request)
    if (session instanceof Response) return session

    if (!body.comment) {
      return NextResponse.json(
        { error: "comment is required" },
        { status: 400 }
      )
    }
    // Author from session, not body
    const comment = await addProjectComment({
      projectId,
      author: session.userName,
      body: body.comment,
    })
    if (!comment)
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    return NextResponse.json({ comment }, { status: 201 })
  }

  if (body.action === "milestone") {
    // ── RBAC: Only admin+ can update milestones ────────────
    const session = await requireRole(request, ["admin", "superadmin"])
    if (session instanceof Response) return session

    if (!body.milestoneId || !body.status) {
      return NextResponse.json(
        { error: "milestoneId and status are required" },
        { status: 400 }
      )
    }
    const milestone = await updateProjectMilestone({
      projectId,
      milestoneId: body.milestoneId,
      status: body.status,
      actorName: session.userName,
      verify: body.verify,
    })
    if (!milestone)
      return NextResponse.json(
        { error: "Project or milestone not found" },
        { status: 404 }
      )
    return NextResponse.json({ milestone })
  }

  if (body.action === "update") {
    // ── RBAC: Only admin+ can post project updates ─────────
    const session = await requireRole(request, ["admin", "superadmin"])
    if (session instanceof Response) return session

    if (!body.text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      )
    }
    const update = await addProjectUpdate({
      projectId,
      text: body.text,
      photos: body.photos,
      videos: body.videos,
      createdBy: session.userName,
      budgetSpentDeltaBdt: body.budgetSpentDeltaBdt,
    })
    if (!update)
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    return NextResponse.json({ update }, { status: 201 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
