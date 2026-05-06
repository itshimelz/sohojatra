import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const SimulatorSchema = z.object({
  totalBudgetBdt: z.number().positive(),
  allocations: z.array(
    z.object({
      category: z.string(),
      amountBdt: z.number().nonnegative(),
    })
  ),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = SimulatorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { totalBudgetBdt, allocations } = parsed.data
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amountBdt, 0)
  const remaining = totalBudgetBdt - totalAllocated
  const overspent = totalAllocated > totalBudgetBdt

  const breakdown = allocations.map((a) => ({
    ...a,
    percentage: totalBudgetBdt > 0 ? Math.round((a.amountBdt / totalBudgetBdt) * 100) : 0,
  }))

  const benchmarks: Record<string, number> = {
    Education: 20,
    Health: 15,
    Infrastructure: 25,
    Environment: 10,
    Safety: 10,
    Economy: 20,
  }

  const insights = breakdown.map((b) => {
    const benchmark = benchmarks[b.category]
    if (!benchmark) return null
    const diff = b.percentage - benchmark
    if (Math.abs(diff) < 3) return null
    return {
      category: b.category,
      message:
        diff > 0
          ? `${b.category} is ${diff}% above the recommended ${benchmark}% benchmark`
          : `${b.category} is ${Math.abs(diff)}% below the recommended ${benchmark}% benchmark`,
      severity: Math.abs(diff) > 10 ? "high" : "medium",
    }
  }).filter(Boolean)

  return NextResponse.json({
    totalBudgetBdt,
    totalAllocated,
    remaining,
    overspent,
    breakdown,
    insights,
  })
}
