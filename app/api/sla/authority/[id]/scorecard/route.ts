import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: authority } = await params
    const now = new Date()

    const [total, resolved, breached, avgRating, recentResolutions] = await Promise.all([
      prisma.slaResponse.count({ where: { authority } }),
      prisma.slaResponse.count({ where: { authority, resolvedAt: { not: null } } }),
      prisma.slaResponse.count({ where: { authority, deadline: { lt: now }, resolvedAt: null } }),
      prisma.slaResponse.aggregate({
        where: { authority, citizenRating: { not: null } },
        _avg: { citizenRating: true },
      }),
      prisma.slaResponse.findMany({
        where: { authority, resolvedAt: { not: null } },
        orderBy: { resolvedAt: "desc" },
        take: 5,
        select: { concernId: true, resolvedAt: true, citizenRating: true, resolutionNote: true },
      }),
    ])

    const score = total > 0
      ? Math.round(((resolved / total) * 60 + (breached === 0 ? 40 : Math.max(0, 40 - breachRate(total, breached)))))
      : 0

    return NextResponse.json({
      authority,
      total,
      resolved,
      breached,
      responseRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgRating: avgRating._avg.citizenRating ?? 0,
      governanceScore: score,
      recentResolutions,
    })
  } catch (error) {
    console.error("[SLA_SCORECARD_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function breachRate(total: number, breached: number) {
  return total > 0 ? Math.round((breached / total) * 40) : 0
}
