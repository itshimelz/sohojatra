import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const ProposalSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  costEstimateBdt: z.number().positive(),
  category: z.string().min(1),
  beneficiaries: z.string().optional(),
  rationale: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const cycle = await prisma.budgetCycle.findUnique({ where: { id } })
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  }
  if (cycle.status !== "Open") {
    return NextResponse.json({ error: "Cycle is not open for proposals" }, { status: 409 })
  }
  if (new Date() > cycle.proposalDeadline) {
    return NextResponse.json({ error: "Proposal deadline has passed" }, { status: 409 })
  }

  const body = await req.json()
  const parsed = ProposalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  if (BigInt(data.costEstimateBdt) > cycle.totalBudgetBdt) {
    return NextResponse.json({ error: "Cost exceeds total cycle budget" }, { status: 422 })
  }

  const proposal = await prisma.budgetProposal.create({
    data: {
      cycleId: id,
      title: data.title,
      description: data.description,
      costEstimateBdt: BigInt(data.costEstimateBdt),
      category: data.category,
      beneficiaries: data.beneficiaries,
      rationale: data.rationale,
      authorId: session.userId,
      authorName: session.userName,
    },
  })

  return NextResponse.json(
    { proposal: { ...proposal, costEstimateBdt: proposal.costEstimateBdt.toString() } },
    { status: 201 }
  )
}
