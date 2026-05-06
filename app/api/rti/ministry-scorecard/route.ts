import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [totalByMinistry, respondedByMinistry] = await Promise.all([
      prisma.rtiRequest.groupBy({
        by: ["targetMinistry"],
        _count: { id: true },
        where: { status: { not: "Draft" } },
      }),
      prisma.rtiRequest.groupBy({
        by: ["targetMinistry"],
        _count: { id: true },
        where: { status: { in: ["Responded", "Resolved"] } },
      }),
    ])

    const respondedMap: Record<string, number> = {}
    for (const r of respondedByMinistry) {
      respondedMap[r.targetMinistry] = r._count.id
    }

    const scorecard = totalByMinistry.map((row) => {
      const total = row._count.id
      const responded = respondedMap[row.targetMinistry] ?? 0
      return {
        ministry: row.targetMinistry,
        total,
        responded,
        complianceRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      }
    })

    scorecard.sort((a, b) => b.complianceRate - a.complianceRate)

    return NextResponse.json({ scorecard })
  } catch (error) {
    console.error("[RTI_SCORECARD_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
