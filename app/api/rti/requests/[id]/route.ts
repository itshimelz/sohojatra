import { NextResponse } from "next/server"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { id } = await params
    const rti = await prisma.rtiRequest.findUnique({ where: { id } })

    if (!rti) return NextResponse.json({ message: "RTI request not found" }, { status: 404 })
    if (rti.userId !== session.userId && !["admin", "superadmin"].includes(session.userRole)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const daysRemaining = rti.deadline
      ? Math.max(0, Math.ceil((rti.deadline.getTime() - now.getTime()) / 86400000))
      : null
    const isOverdue = rti.deadline && !rti.respondedAt && rti.deadline < now

    return NextResponse.json({ rti, daysRemaining, isOverdue })
  } catch (error) {
    console.error("[RTI_REQUEST_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
