import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const RoundSchema = z.object({
  title: z.string().min(3),
  prompt: z.string().min(10),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = RoundSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const miniPublic = await prisma.miniPublic.findUnique({ where: { id } })
  if (!miniPublic) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const lastRound = await prisma.deliberationRound.findFirst({
    where: { miniPublicId: id },
    orderBy: { roundNumber: "desc" },
  })
  const nextNumber = (lastRound?.roundNumber ?? 0) + 1

  if (lastRound && lastRound.status === "Open") {
    await prisma.deliberationRound.update({
      where: { id: lastRound.id },
      data: { status: "Closed", closedAt: new Date() },
    })
  }

  const round = await prisma.deliberationRound.create({
    data: {
      miniPublicId: id,
      roundNumber: nextNumber,
      title: parsed.data.title,
      prompt: parsed.data.prompt,
    },
  })

  return NextResponse.json({ round }, { status: 201 })
}
