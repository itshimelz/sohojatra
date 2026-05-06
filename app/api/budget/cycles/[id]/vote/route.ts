import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const VoteSchema = z.object({
  proposalId: z.string().min(1),
  voteType: z.enum(["up", "down"]),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const cycle = await prisma.budgetCycle.findUnique({ where: { id } })
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  }
  if (new Date() > cycle.votingDeadline) {
    return NextResponse.json({ error: "Voting deadline has passed" }, { status: 409 })
  }

  const body = await req.json()
  const parsed = VoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { proposalId, voteType } = parsed.data

  const proposal = await prisma.budgetProposal.findFirst({
    where: { id: proposalId, cycleId: id },
  })
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found in this cycle" }, { status: 404 })
  }

  const existing = await prisma.budgetVote.findUnique({
    where: { proposalId_userId: { proposalId, userId: session.userId } },
  })

  if (existing) {
    if (existing.voteType === voteType) {
      await prisma.$transaction([
        prisma.budgetVote.delete({ where: { id: existing.id } }),
        prisma.budgetProposal.update({
          where: { id: proposalId },
          data: voteType === "up" ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } },
        }),
      ])
      return NextResponse.json({ action: "removed" })
    }

    await prisma.$transaction([
      prisma.budgetVote.update({
        where: { id: existing.id },
        data: { voteType },
      }),
      prisma.budgetProposal.update({
        where: { id: proposalId },
        data:
          voteType === "up"
            ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
            : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } },
      }),
    ])
    return NextResponse.json({ action: "changed" })
  }

  await prisma.$transaction([
    prisma.budgetVote.create({
      data: { proposalId, userId: session.userId, voteType },
    }),
    prisma.budgetProposal.update({
      where: { id: proposalId },
      data: voteType === "up" ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
    }),
  ])

  return NextResponse.json({ action: "added" })
}
