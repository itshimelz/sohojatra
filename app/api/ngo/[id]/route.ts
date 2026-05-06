import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ngo = await prisma.ngoProfile.findUnique({
    where: { id },
    include: {
      adoptions: {
        orderBy: { adoptedAt: "desc" },
        take: 20,
      },
    },
  })

  if (!ngo) {
    return NextResponse.json({ error: "NGO not found" }, { status: 404 })
  }

  return NextResponse.json({ ngo })
}
