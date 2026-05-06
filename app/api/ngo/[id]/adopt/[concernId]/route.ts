import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const AdoptSchema = z.object({
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; concernId: string }> }
) {
  const { id, concernId } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const ngo = await prisma.ngoProfile.findUnique({ where: { id } })
  if (!ngo) {
    return NextResponse.json({ error: "NGO not found" }, { status: 404 })
  }
  if (ngo.createdBy !== session.userId) {
    return NextResponse.json({ error: "Only the NGO owner can adopt concerns" }, { status: 403 })
  }

  const concern = await prisma.concern.findUnique({ where: { id: concernId } })
  if (!concern) {
    return NextResponse.json({ error: "Concern not found" }, { status: 404 })
  }

  const existing = await prisma.ngoConcernAdoption.findUnique({
    where: { ngoId_concernId: { ngoId: id, concernId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Already adopted" }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = AdoptSchema.safeParse(body)

  const [adoption] = await prisma.$transaction([
    prisma.ngoConcernAdoption.create({
      data: {
        ngoId: id,
        concernId,
        notes: parsed.success ? parsed.data.notes : undefined,
      },
    }),
    prisma.ngoProfile.update({
      where: { id },
      data: { totalAdoptions: { increment: 1 }, impactScore: { increment: 10 } },
    }),
  ])

  return NextResponse.json({ adoption }, { status: 201 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; concernId: string }> }
) {
  const { id, concernId } = await params

  await prisma.ngoConcernAdoption.deleteMany({
    where: { ngoId: id, concernId },
  })

  await prisma.ngoProfile.update({
    where: { id },
    data: { totalAdoptions: { decrement: 1 }, impactScore: { decrement: 10 } },
  })

  return NextResponse.json({ success: true })
}
