import { NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"

const reportSchema = z.object({
  category: z.enum(["Corruption", "Bribery", "Misconduct", "RightsViolation", "FraudAndEmbezzlement", "Other"]),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  evidence: z.string().optional(),
  targetAgency: z.string().min(3, "Target agency is required"),
  targetDivision: z.string().optional(),
})

function generateCaseToken() {
  return randomBytes(16).toString("hex").toUpperCase()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = reportSchema.parse(body)

    const caseToken = generateCaseToken()

    const report = await prisma.whistleblowerReport.create({
      data: {
        caseToken,
        category: data.category,
        severity: data.severity,
        description: data.description,
        evidence: data.evidence ?? null,
        targetAgency: data.targetAgency,
        targetDivision: data.targetDivision ?? null,
        status: "Received",
        escalationTier: 0,
      },
    })

    // Return only the case token and minimal info — never the full record
    return NextResponse.json(
      {
        caseToken: report.caseToken,
        status: report.status,
        createdAt: report.createdAt,
        message:
          "Report received. Save your case token — it is the only way to check your report status. No identity data has been stored.",
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[WHISTLEBLOWER_REPORT_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
