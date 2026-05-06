import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20
  const sortBy = searchParams.get("sortBy") ?? "totalContracts"

  const orderBy =
    sortBy === "flagCount"
      ? { flagCount: "desc" as const }
      : sortBy === "totalValue"
        ? { totalValueBdt: "desc" as const }
        : { totalContracts: "desc" as const }

  const [contractors, total] = await Promise.all([
    prisma.procurementContractor.findMany({
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.procurementContractor.count(),
  ])

  return NextResponse.json({
    contractors: contractors.map((c) => ({
      ...c,
      totalValueBdt: c.totalValueBdt.toString(),
    })),
    total,
    page,
    pageSize,
  })
}
