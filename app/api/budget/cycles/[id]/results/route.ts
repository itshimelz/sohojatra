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
      },
    },
  })

  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  }

  const totalVotes = cycle.proposals.reduce((sum, p) => sum + p.upvotes + p.downvotes, 0)
  const totalBudget = Number(cycle.totalBudgetBdt)

  let remainingBudget = totalBudget
  const ranked = cycle.proposals.map((p) => {
    const netScore = p.upvotes - p.downvotes
    const cost = Number(p.costEstimateBdt)
    const funded = remainingBudget >= cost && netScore > 0
    if (funded) remainingBudget -= cost
    return {
      ...p,
      costEstimateBdt: p.costEstimateBdt.toString(),
      netScore,
      funded,
      voteShare: totalVotes > 0 ? Math.round(((p.upvotes) / totalVotes) * 100) : 0,
    }
  })

  return NextResponse.json({
    cycle: {
      ...cycle,
      totalBudgetBdt: cycle.totalBudgetBdt.toString(),
      proposals: undefined,
    },
    ranked,
    summary: {
      totalProposals: cycle.proposals.length,
      totalVotes,
      fundedCount: ranked.filter((p) => p.funded).length,
      remainingBudget,
    },
  })
}
