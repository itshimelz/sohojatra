import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const TIER_LABELS = ["Platform Review", "ACC (Anti-Corruption Commission)", "Media Partners", "Public Record"]

export async function GET(_req: Request, { params }: { params: Promise<{ caseToken: string }> }) {
  try {
    const { caseToken } = await params

    const report = await prisma.whistleblowerReport.findUnique({
      where: { caseToken: caseToken.toUpperCase() },
      select: {
        caseToken: true,
        category: true,
        severity: true,
        status: true,
        escalationTier: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude: description, evidence, targetDivision from public status endpoint
      },
    })

    if (!report) {
      return NextResponse.json({ message: "Case not found. Check your token." }, { status: 404 })
    }

    return NextResponse.json({
      ...report,
      currentTier: TIER_LABELS[report.escalationTier] ?? "Platform Review",
      nextTier: TIER_LABELS[report.escalationTier + 1] ?? null,
    })
  } catch (error) {
    console.error("[WHISTLEBLOWER_STATUS_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
