import { NextResponse } from "next/server"

import { getSolutionPlan, reviewSolutionPlan } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const plan = await getSolutionPlan(id)
  if (!plan) {
    return NextResponse.json({ error: "Solution plan not found" }, { status: 404 })
  }
  return NextResponse.json({ plan })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "reject" | "requestRevision" | "assignDepartment"
    actorName?: string
    department?: string
    comments?: string
    notifyUserId?: string
  }

  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 })
  }

  const updated = await reviewSolutionPlan({
    planId,
    action: body.action,
    actorName: body.actorName ?? "Government Authority",
    department: body.department,
    comments: body.comments,
    notifyUserId: body.notifyUserId,
  })

  if (!updated) {
    return NextResponse.json({ error: "Solution plan not found" }, { status: 404 })
  }

  return NextResponse.json({ plan: updated })
}
