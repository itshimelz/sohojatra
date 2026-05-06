import { NextResponse } from "next/server"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ concernId: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { concernId } = await params

    const sla = await prisma.slaResponse.findUnique({ where: { concernId } })
    if (!sla) {
      return NextResponse.json({ message: "No SLA record for this concern" }, { status: 404 })
    }

    const newLevel = Math.min(sla.escalationLevel + 1, 3)
    const levelLabels = ["None", "Supervisor", "Ministry Head", "Public Flagging"]

    const updated = await prisma.slaResponse.update({
      where: { concernId },
      data: { escalationLevel: newLevel, status: newLevel === 3 ? "Escalated" : sla.status },
    })

    return NextResponse.json({
      sla: updated,
      escalatedTo: levelLabels[newLevel],
      message: `Concern escalated to ${levelLabels[newLevel]}`,
    })
  } catch (error) {
    console.error("[SLA_ESCALATE_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
