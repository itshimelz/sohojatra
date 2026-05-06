import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const TIER_LABELS = ["Platform Review", "ACC (Anti-Corruption Commission)", "Media Partners", "Public Record"]

export async function POST(_req: Request, { params }: { params: Promise<{ caseToken: string }> }) {
  try {
    const { caseToken } = await params

    const report = await prisma.whistleblowerReport.findUnique({
      where: { caseToken: caseToken.toUpperCase() },
      select: { id: true, escalationTier: true, status: true },
    })

    if (!report) return NextResponse.json({ message: "Case not found" }, { status: 404 })
    if (report.escalationTier >= 3) {
      return NextResponse.json({ message: "Already at maximum escalation tier" }, { status: 400 })
    }

    const newTier = report.escalationTier + 1
    await prisma.whistleblowerReport.update({
      where: { caseToken: caseToken.toUpperCase() },
      data: { escalationTier: newTier, status: "Escalated" },
    })

    return NextResponse.json({
      escalationTier: newTier,
      escalatedTo: TIER_LABELS[newTier],
      message: `Case escalated to ${TIER_LABELS[newTier]}`,
    })
  } catch (error) {
    console.error("[WHISTLEBLOWER_ESCALATE_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
