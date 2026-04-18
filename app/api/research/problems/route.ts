/**
 * GET/POST /api/research/problems — List or create research problems.
 *
 * SECURITY:
 *   - GET: Public (transparency).
 *   - POST (create): Requires admin or superadmin role (RBAC).
 *     Only government authorities can release research problems with grants.
 *   - POST (release/close): Requires admin or superadmin role.
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import {
  createResearchProblem,
  listResearchProblems,
} from "@/lib/sohojatra/store"

// GET is public — research problems are publicly listed
export async function GET() {
  return NextResponse.json({ problems: await listResearchProblems() })
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can manage research problems ───────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    action?: "create" | "release" | "close"
    title?: string
    ministry?: string
    grant?: string
    deadline?: string
    summary?: string
    id?: string
  }

  if (body.action === "release" || body.action === "close") {
    return NextResponse.json({
      id: body.id,
      status: body.action === "release" ? "released" : "closed",
      updatedAt: new Date().toISOString(),
    })
  }

  if (
    !body.title ||
    !body.ministry ||
    !body.grant ||
    !body.deadline ||
    !body.summary
  ) {
    return NextResponse.json(
      {
        error:
          "title, ministry, grant, deadline, summary are required",
      },
      { status: 400 }
    )
  }

  const problem = await createResearchProblem({
    title: body.title,
    ministry: body.ministry,
    grant: body.grant,
    deadline: body.deadline,
    summary: body.summary,
  })

  return NextResponse.json({ problem }, { status: 201 })
}