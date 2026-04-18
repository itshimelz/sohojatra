/**
 * GET/POST /api/projects — List or create government projects.
 *
 * SECURITY:
 *   - GET: Public (transparency — projects are government-initiated).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only government administrators can create tracked projects.
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { createProject, listProjects } from "@/lib/sohojatra/store"

// GET is public — government transparency
export async function GET() {
  return NextResponse.json({ projects: await listProjects() })
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can create projects ────────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as {
    title?: string
    ministry?: string
    department?: string
    owner?: string
    deadline?: string
    budgetAllocatedBdt?: number
  }

  if (
    !body.title ||
    !body.ministry ||
    !body.department ||
    !body.deadline ||
    body.budgetAllocatedBdt === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "title, ministry, department, deadline, budgetAllocatedBdt are required",
      },
      { status: 400 }
    )
  }

  const project = await createProject({
    title: body.title,
    ministry: body.ministry,
    department: body.department,
    owner: body.owner ?? session.userName,
    deadline: body.deadline,
    budgetAllocatedBdt: body.budgetAllocatedBdt,
  })

  return NextResponse.json({ project }, { status: 201 })
}
