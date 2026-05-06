import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await optionalSession()

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: {
      statements: {
        orderBy: { agreeCount: "desc" },
        include: { _count: { select: { votes: true } } },
      },
    },
  })

  if (!consultation) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 })
  }

  // If user is logged in, attach their votes
  let userVotes: Record<string, string> = {}
  if (session) {
    const votes = await prisma.consultationVote.findMany({
      where: {
        userId: session.userId,
        statementId: { in: consultation.statements.map((s) => s.id) },
      },
    })
    userVotes = Object.fromEntries(votes.map((v) => [v.statementId, v.vote]))
  }

  const totalParticipants = await prisma.consultationVote
    .findMany({
      where: { statementId: { in: consultation.statements.map((s) => s.id) } },
      distinct: ["userId"],
    })
    .then((r) => r.length)

  return NextResponse.json({ consultation, userVotes, totalParticipants })
}
