import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await optionalSession()

  const bill = await prisma.parliamentBill.findUnique({
    where: { id },
    include: {
      mpVotes: {
        include: { mp: true },
        orderBy: { votedAt: "desc" },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { comments: true, mpVotes: true } },
    },
  })

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 })
  }

  const voteSummary = bill.mpVotes.reduce(
    (acc, v) => {
      acc[v.vote] = (acc[v.vote] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return NextResponse.json({
    bill,
    voteSummary,
    userId: session ? session.userId : null,
  })
}
