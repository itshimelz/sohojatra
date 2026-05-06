import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const riskLevel = searchParams.get("riskLevel")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 15

  const where: Record<string, unknown> = {}
  if (riskLevel) where.riskLevel = riskLevel

  const [predictions, total] = await Promise.all([
    prisma.impactPrediction.findMany({
      where,
      orderBy: { impactScore: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.impactPrediction.count({ where }),
  ])

  const concernIds = predictions.map((p) => p.concernId)
  const concerns = await prisma.concern.findMany({
    where: { id: { in: concernIds } },
    select: { id: true, title: true, status: true, category: true, district: true, upvotes: true },
  })
  const concernMap = Object.fromEntries(concerns.map((c) => [c.id, c]))

  const enriched = predictions.map((p) => ({ ...p, concern: concernMap[p.concernId] ?? null }))

  return NextResponse.json({ predictions: enriched, total, page, pageSize })
}
