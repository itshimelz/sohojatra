import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const THRESHOLDS = [
  { count: 500, tier: 1, label: "Formal Acknowledgment Required", action: "Authority must formally acknowledge within 7 days", days: 7 },
  { count: 5000, tier: 2, label: "Official Written Response Required", action: "Authority must provide written response within 30 days", days: 30 },
  { count: 50000, tier: 3, label: "Debate / Hearing Required", action: "Relevant legislative body must hold a hearing or debate", days: 60 },
  { count: 500000, tier: 4, label: "National Policy Review Required", action: "National-level policy review must be initiated", days: 90 },
]

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const petition = await prisma.petition.findUnique({
      where: { id },
      select: { signatureCount: true, status: true, currentTier: true },
    })

    if (!petition) return NextResponse.json({ message: "Petition not found" }, { status: 404 })

    const unlocked = THRESHOLDS.filter((t) => petition.signatureCount >= t.count)
    const next = THRESHOLDS.find((t) => petition.signatureCount < t.count)
    const progress = next ? Math.round((petition.signatureCount / next.count) * 100) : 100

    return NextResponse.json({
      signatureCount: petition.signatureCount,
      unlockedTiers: unlocked,
      nextThreshold: next ?? null,
      progressToNext: progress,
      allThresholds: THRESHOLDS,
    })
  } catch (error) {
    console.error("[PETITION_THRESHOLD_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
