import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [allPredictions, riskCounts] = await Promise.all([
    prisma.impactPrediction.findMany({
      orderBy: { impactScore: "desc" },
      take: 100,
    }),
    prisma.impactPrediction.groupBy({
      by: ["riskLevel"],
      _count: { riskLevel: true },
      _avg: { predictedDays: true, impactScore: true },
    }),
  ])

  const topAtRisk = allPredictions.slice(0, 10)
  const concernIds = topAtRisk.map((p) => p.concernId)
  const concerns = await prisma.concern.findMany({
    where: { id: { in: concernIds } },
    select: { id: true, title: true, status: true, category: true, district: true, upvotes: true },
  })
  const concernMap = Object.fromEntries(concerns.map((c) => [c.id, c]))

  const avgDays = allPredictions.length > 0
    ? Math.round(allPredictions.reduce((s, p) => s + p.predictedDays, 0) / allPredictions.length)
    : 0

  return NextResponse.json({
    riskCounts,
    topAtRisk: topAtRisk.map((p) => ({ ...p, concern: concernMap[p.concernId] ?? null })),
    totalPredictions: allPredictions.length,
    avgPredictedDays: avgDays,
  })
}
