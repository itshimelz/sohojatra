import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const contractor = await prisma.procurementContractor.findUnique({
    where: { id },
  })
  if (!contractor) {
    return NextResponse.json({ error: "Contractor not found" }, { status: 404 })
  }

  const tenders = await prisma.procurementTender.findMany({
    where: { contractorName: contractor.name },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })

  return NextResponse.json({
    contractor: {
      ...contractor,
      totalValueBdt: contractor.totalValueBdt.toString(),
    },
    tenders: tenders.map((t) => ({
      ...t,
      estimatedValueBdt: t.estimatedValueBdt.toString(),
      awardedValueBdt: t.awardedValueBdt?.toString() ?? null,
    })),
  })
}
