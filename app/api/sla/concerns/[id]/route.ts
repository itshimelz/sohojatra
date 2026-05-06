import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const concern = await prisma.concern.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, category: true, createdAt: true },
    })
    if (!concern) {
      return NextResponse.json({ message: "Concern not found" }, { status: 404 })
    }

    const sla = await prisma.slaResponse.findUnique({ where: { concernId: id } })

    const now = new Date()
    const isBreached = sla && !sla.resolvedAt && sla.deadline < now
    const hoursRemaining = sla ? Math.round((sla.deadline.getTime() - now.getTime()) / 3600000) : null

    return NextResponse.json({ concern, sla, isBreached, hoursRemaining })
  } catch (error) {
    console.error("[SLA_CONCERN_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
