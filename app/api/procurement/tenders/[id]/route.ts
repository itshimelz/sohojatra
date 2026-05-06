import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const tender = await prisma.procurementTender.findUnique({ where: { id } })
  if (!tender) {
    return NextResponse.json({ error: "Tender not found" }, { status: 404 })
  }

  let contractor = null
  if (tender.contractorName) {
    contractor = await prisma.procurementContractor.findUnique({
      where: { name: tender.contractorName },
    })
  }

  return NextResponse.json({
    tender: {
      ...tender,
      estimatedValueBdt: tender.estimatedValueBdt.toString(),
      awardedValueBdt: tender.awardedValueBdt?.toString() ?? null,
    },
    contractor: contractor
      ? {
          ...contractor,
          totalValueBdt: contractor.totalValueBdt.toString(),
        }
      : null,
  })
}
