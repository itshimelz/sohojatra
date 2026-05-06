import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    const [total, responded, resolved, breached, byAuthority] = await Promise.all([
      prisma.slaResponse.count(),
      prisma.slaResponse.count({ where: { respondedAt: { not: null } } }),
      prisma.slaResponse.count({ where: { resolvedAt: { not: null } } }),
      prisma.slaResponse.count({ where: { deadline: { lt: now }, resolvedAt: null } }),
      prisma.slaResponse.groupBy({
        by: ["authority"],
        _count: { id: true },
        _avg: { citizenRating: true },
        where: { authority: { not: null } },
      }),
    ])

    const avgRating = await prisma.slaResponse.aggregate({
      _avg: { citizenRating: true },
      where: { citizenRating: { not: null } },
    })

    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    const breachRate = total > 0 ? Math.round((breached / total) * 100) : 0

    return NextResponse.json({
      summary: { total, responded, resolved, breached, responseRate, resolutionRate, breachRate },
      avgRating: avgRating._avg.citizenRating ?? 0,
      byAuthority: byAuthority.map((a) => ({
        authority: a.authority,
        total: a._count.id,
        avgRating: a._avg.citizenRating ?? 0,
      })),
    })
  } catch (error) {
    console.error("[SLA_DASHBOARD_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
