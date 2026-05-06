import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const resolveSchema = z.object({
  resolutionNote: z.string().min(10, "Resolution note must be at least 10 characters"),
  resolutionPhotos: z.array(z.string().url()).max(5).optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { id } = await params
    const body = await request.json()
    const { resolutionNote, resolutionPhotos } = resolveSchema.parse(body)

    const concern = await prisma.concern.findUnique({ where: { id } })
    if (!concern) {
      return NextResponse.json({ message: "Concern not found" }, { status: 404 })
    }

    const sla = await prisma.slaResponse.upsert({
      where: { concernId: id },
      create: {
        concernId: id,
        deadline: new Date(Date.now() + 7 * 24 * 3600000),
        assignedTo: session.userId,
        assignedName: session.userName,
        authority: session.userRole,
        status: "Resolved",
        respondedAt: new Date(),
        resolvedAt: new Date(),
        resolutionNote,
        resolutionPhotos: resolutionPhotos ?? [],
      },
      update: {
        status: "Resolved",
        resolvedAt: new Date(),
        respondedAt: (await prisma.slaResponse.findUnique({ where: { concernId: id } }))
          ?.respondedAt ?? new Date(),
        resolutionNote,
        resolutionPhotos: resolutionPhotos ?? [],
        assignedTo: session.userId,
        assignedName: session.userName,
      },
    })

    await prisma.concern.update({
      where: { id },
      data: { status: "Resolved", updatedAt: new Date() },
    })

    return NextResponse.json({ sla }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[SLA_RESOLVE_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
