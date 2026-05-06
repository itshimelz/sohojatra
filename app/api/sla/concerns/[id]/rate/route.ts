import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { id } = await params
    const body = await request.json()
    const { rating, comment } = rateSchema.parse(body)

    const sla = await prisma.slaResponse.findUnique({ where: { concernId: id } })
    if (!sla) {
      return NextResponse.json({ message: "No SLA record found for this concern" }, { status: 404 })
    }
    if (!sla.resolvedAt) {
      return NextResponse.json({ message: "Concern not yet resolved" }, { status: 400 })
    }

    const updated = await prisma.slaResponse.update({
      where: { concernId: id },
      data: { citizenRating: rating, citizenComment: comment ?? null },
    })

    return NextResponse.json({ sla: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[SLA_RATE_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
