import { NextResponse } from "next/server"

import { createSolutionPlan, listSolutionPlans } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const concernId = searchParams.get("concernId") ?? undefined
  const statusParam = searchParams.get("status")
  const status =
    statusParam === "Submitted" ||
    statusParam === "UnderReview" ||
    statusParam === "Approved" ||
    statusParam === "Rejected" ||
    statusParam === "RevisionRequested"
      ? statusParam
      : undefined
  return NextResponse.json({
    plans: await listSolutionPlans({
      concernId,
      status,
    }),
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    concernId?: string
    title?: string
    summary?: string
    technicalDocs?: string[]
    budgetEstimateBdt?: number
    timeline?: string
    riskNotes?: string
    submittedBy?: string
    notifyUserId?: string
  }

  if (
    !body.concernId ||
    !body.title ||
    !body.summary ||
    body.budgetEstimateBdt === undefined ||
    !body.timeline ||
    !body.riskNotes
  ) {
    return NextResponse.json(
      {
        error:
          "concernId, title, summary, budgetEstimateBdt, timeline, riskNotes are required",
      },
      { status: 400 }
    )
  }

  const plan = await createSolutionPlan({
    concernId: body.concernId,
    title: body.title,
    summary: body.summary,
    technicalDocs: body.technicalDocs,
    budgetEstimateBdt: body.budgetEstimateBdt,
    timeline: body.timeline,
    riskNotes: body.riskNotes,
    submittedBy: body.submittedBy ?? "Expert",
    notifyUserId: body.notifyUserId,
  })

  return NextResponse.json({ plan }, { status: 201 })
}
