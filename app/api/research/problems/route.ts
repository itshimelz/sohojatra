import { NextResponse } from "next/server"

import { createResearchProblem, listResearchProblems } from "@/lib/sohojatra/store"

export async function GET() {
  return NextResponse.json({ problems: await listResearchProblems() })
}

export async function POST(request: Request) {
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

  if (!body.title || !body.ministry || !body.grant || !body.deadline || !body.summary) {
    return NextResponse.json({ error: "title, ministry, grant, deadline, summary are required" }, { status: 400 })
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