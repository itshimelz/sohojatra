import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const THRESHOLDS = [
  { count: 500, tier: 1, label: "Formal Acknowledgment", days: 7 },
  { count: 5000, tier: 2, label: "Official Written Response", days: 30 },
  { count: 50000, tier: 3, label: "Legislative Debate/Hearing", days: 60 },
  { count: 500000, tier: 4, label: "National Policy Review", days: 90 },
]

function getThresholdStatus(count: number) {
  const currentTier = [...THRESHOLDS].reverse().find((t) => count >= t.count)
  const nextTier = THRESHOLDS.find((t) => count < t.count)
  return { currentTier, nextTier, toNextTier: nextTier ? nextTier.count - count : 0 }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const petition = await prisma.petition.findUnique({
      where: { id },
      include: { _count: { select: { signatures: true } } },
    })

    if (!petition) return NextResponse.json({ message: "Petition not found" }, { status: 404 })

    const thresholdStatus = getThresholdStatus(petition.signatureCount)
    return NextResponse.json({ petition, thresholdStatus })
  } catch (error) {
    console.error("[PETITION_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
