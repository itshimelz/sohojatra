import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cycle = await prisma.budgetCycle.findUnique({
    where: { id },
    include: {
      proposals: {
        orderBy: { upvotes: "desc" },
        include: { _count: { select: { votes: true } } },
      },
    },
  })

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  }

  const totalAllocated = cycle.proposals.reduce(
    (sum, p) => sum + Number(p.costEstimateBdt),
    0
  )

  return NextResponse.json({
    cycle: {
      ...cycle,
      totalBudgetBdt: cycle.totalBudgetBdt.toString(),
      proposals: cycle.proposals.map((p) => ({
        ...p,
        costEstimateBdt: p.costEstimateBdt.toString(),
      })),
    },
    totalAllocated,
    remaining: Number(cycle.totalBudgetBdt) - totalAllocated,
  })
}
