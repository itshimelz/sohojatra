import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const appealSchema = z.object({
  appealText: z.string().min(20, "Appeal must be at least 20 characters"),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { id } = await params
    const rti = await prisma.rtiRequest.findUnique({ where: { id } })

    if (!rti) return NextResponse.json({ message: "RTI request not found" }, { status: 404 })
    if (rti.userId !== session.userId) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    if (rti.status === "Appealed") return NextResponse.json({ message: "Appeal already filed" }, { status: 400 })

    const body = await request.json()
    const { appealText } = appealSchema.parse(body)

    const now = new Date()
    const appealDeadline = new Date(now.getTime() + 30 * 24 * 3600000)

    const updated = await prisma.rtiRequest.update({
      where: { id },
      data: {
        status: "Appealed",
        appealText,
        appealedAt: now,
        appealDeadline,
      },
    })

    return NextResponse.json({ rti: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[RTI_APPEAL_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
