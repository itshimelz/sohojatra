import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

const SubmitSchema = z.object({
  roundId: z.string().min(1),
  content: z.string().min(10).max(2000),
  stance: z.enum(["Support", "Oppose", "Neutral", "Conditional"]).optional(),
  authorName: z.string().min(2).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await optionalSession()

  const body = await req.json()
  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const miniPublic = await prisma.miniPublic.findUnique({ where: { id } })
  if (!miniPublic) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!["Deliberating", "Forming"].includes(miniPublic.status)) {
    return NextResponse.json({ error: "This mini-public is not accepting submissions" }, { status: 409 })
  }

  const round = await prisma.deliberationRound.findUnique({
    where: { id: parsed.data.roundId },
  })
  if (!round || round.miniPublicId !== id) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 })
  }
  if (round.status !== "Open") {
    return NextResponse.json({ error: "This round is closed" }, { status: 409 })
  }

  const submission = await prisma.deliberationSubmission.create({
    data: {
      roundId: parsed.data.roundId,
      content: parsed.data.content,
      stance: parsed.data.stance ?? "Neutral",
      authorName: session?.userName ?? parsed.data.authorName ?? "Anonymous",
      authorId: session?.userId,
    },
  })

  return NextResponse.json({ submission }, { status: 201 })
}
