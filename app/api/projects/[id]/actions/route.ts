import { NextResponse } from "next/server"

import { addProjectComment, addProjectUpdate, toggleProjectFollow, updateProjectMilestone } from "@/lib/sohojatra/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    action?: "toggleFollow" | "comment" | "milestone" | "update"
    followerId?: string
    author?: string
    comment?: string
    milestoneId?: string
    status?: "Planned" | "InProgress" | "SubmittedForVerification" | "Verified"
    actorName?: string
    verify?: boolean
    text?: string
    photos?: string[]
    videos?: string[]
    budgetSpentDeltaBdt?: number
  }

  if (body.action === "toggleFollow") {
    if (!body.followerId) {
      return NextResponse.json({ error: "followerId is required" }, { status: 400 })
    }
    const result = await toggleProjectFollow({ projectId, followerId: body.followerId })
    if (!result) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    return NextResponse.json(result)
  }

  if (body.action === "comment") {
    if (!body.comment) {
      return NextResponse.json({ error: "comment is required" }, { status: 400 })
    }
    const comment = await addProjectComment({
      projectId,
      author: body.author ?? "Citizen",
      body: body.comment,
    })
    if (!comment) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    return NextResponse.json({ comment }, { status: 201 })
  }

  if (body.action === "milestone") {
    if (!body.milestoneId || !body.status) {
      return NextResponse.json({ error: "milestoneId and status are required" }, { status: 400 })
    }
    const milestone = await updateProjectMilestone({
      projectId,
      milestoneId: body.milestoneId,
      status: body.status,
      actorName: body.actorName ?? "System",
      verify: body.verify,
    })
    if (!milestone) return NextResponse.json({ error: "Project or milestone not found" }, { status: 404 })
    return NextResponse.json({ milestone })
  }

  if (body.action === "update") {
    if (!body.text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 })
    }
    const update = await addProjectUpdate({
      projectId,
      text: body.text,
      photos: body.photos,
      videos: body.videos,
      createdBy: body.actorName ?? "Implementing Team",
      budgetSpentDeltaBdt: body.budgetSpentDeltaBdt,
    })
    if (!update) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    return NextResponse.json({ update }, { status: 201 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
