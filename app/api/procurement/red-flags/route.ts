import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [highRisk, stats] = await Promise.all([
    prisma.procurementTender.findMany({
      where: { redFlagScore: { gt: 20 } },
      orderBy: { redFlagScore: "desc" },
      take: 50,
    }),
    prisma.procurementTender.groupBy({
      by: ["ministry"],
      _count: { id: true },
      _avg: { redFlagScore: true },
      where: { redFlagScore: { gt: 0 } },
      orderBy: { _avg: { redFlagScore: "desc" } },
      take: 10,
    }),
  ])

  const flagTypeCounts: Record<string, number> = {}
  for (const t of highRisk) {
    const flags = t.redFlags as string[]
    for (const f of flags) {
      flagTypeCounts[f] = (flagTypeCounts[f] ?? 0) + 1
    }
  }

  return NextResponse.json({
    highRisk: highRisk.map((t) => ({
      ...t,
      estimatedValueBdt: t.estimatedValueBdt.toString(),
      awardedValueBdt: t.awardedValueBdt?.toString() ?? null,
    })),
    ministryRisk: stats.map((s) => ({
      ministry: s.ministry,
      count: s._count.id,
      avgScore: Math.round((s._avg.redFlagScore ?? 0) * 10) / 10,
    })),
    flagTypeCounts,
  })
}
