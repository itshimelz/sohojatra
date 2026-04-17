import { NextResponse } from "next/server"

import { createProject, listProjects } from "@/lib/sohojatra/store"

export async function GET() {
  return NextResponse.json({ projects: await listProjects() })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string
    ministry?: string
    department?: string
    owner?: string
    deadline?: string
    budgetAllocatedBdt?: number
  }

  if (!body.title || !body.ministry || !body.department || !body.deadline || body.budgetAllocatedBdt === undefined) {
    return NextResponse.json(
      { error: "title, ministry, department, deadline, budgetAllocatedBdt are required" },
      { status: 400 }
    )
  }

  const project = await createProject({
    title: body.title,
    ministry: body.ministry,
    department: body.department,
    owner: body.owner ?? "Implementing Team",
    deadline: body.deadline,
    budgetAllocatedBdt: body.budgetAllocatedBdt,
  })

  return NextResponse.json({ project }, { status: 201 })
}
