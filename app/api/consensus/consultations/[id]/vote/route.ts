import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const VoteSchema = z.object({
  statementId: z.string().min(1),
  vote: z.enum(["agree", "disagree", "pass"]),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const consultation = await prisma.consultation.findUnique({ where: { id } })
  if (!consultation) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 })
  }
  if (consultation.status !== "Open") {
    return NextResponse.json({ error: "Consultation is closed" }, { status: 409 })
  }

  const body = await req.json()
  const parsed = VoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { statementId, vote } = parsed.data

  const statement = await prisma.consultationStatement.findFirst({
    where: { id: statementId, consultationId: id },
  })
  if (!statement) {
    return NextResponse.json({ error: "Statement not found in this consultation" }, { status: 404 })
  }

  const existing = await prisma.consultationVote.findUnique({
    where: { statementId_userId: { statementId, userId: session.userId } },
  })

  const voteDeltas = (oldVote: string | null, newVote: string) => {
    const dec: Record<string, number> = { agreeCount: 0, disagreeCount: 0, passCount: 0 }
    const inc: Record<string, number> = { agreeCount: 0, disagreeCount: 0, passCount: 0 }
    if (oldVote) dec[`${oldVote}Count`] = -1
    inc[`${newVote}Count`] = 1
    return {
      agreeCount: { increment: inc.agreeCount + dec.agreeCount },
      disagreeCount: { increment: inc.disagreeCount + dec.disagreeCount },
      passCount: { increment: inc.passCount + dec.passCount },
    }
  }

  if (existing) {
    if (existing.vote === vote) {
      // Toggle off
      await prisma.$transaction([
        prisma.consultationVote.delete({ where: { id: existing.id } }),
        prisma.consultationStatement.update({
          where: { id: statementId },
          data: { [`${vote}Count`]: { decrement: 1 } },
        }),
      ])
      return NextResponse.json({ action: "removed" })
    }

    await prisma.$transaction([
      prisma.consultationVote.update({ where: { id: existing.id }, data: { vote } }),
      prisma.consultationStatement.update({
        where: { id: statementId },
        data: voteDeltas(existing.vote, vote),
      }),
    ])
    return NextResponse.json({ action: "changed" })
  }

  await prisma.$transaction([
    prisma.consultationVote.create({ data: { statementId, userId: session.userId, vote } }),
    prisma.consultationStatement.update({
      where: { id: statementId },
      data: { [`${vote}Count`]: { increment: 1 } },
    }),
  ])

  return NextResponse.json({ action: "added" })
}
