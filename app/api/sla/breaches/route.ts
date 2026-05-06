import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()

    const breaches = await prisma.slaResponse.findMany({
      where: { deadline: { lt: now }, resolvedAt: null },
      orderBy: { deadline: "asc" },
      take: 50,
    })

    const enriched = await Promise.all(
      breaches.map(async (sla) => {
        const concern = await prisma.concern.findUnique({
          where: { id: sla.concernId },
          select: { id: true, title: true, category: true, location: true, district: true },
        })
        return {
          ...sla,
          concern,
          overdueHours: Math.round((now.getTime() - sla.deadline.getTime()) / 3600000),
        }
      })
    )

    return NextResponse.json({ breaches: enriched, total: enriched.length })
  } catch (error) {
    console.error("[SLA_BREACHES_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
