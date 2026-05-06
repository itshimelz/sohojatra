import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const RegisterSchema = z.object({
  name: z.string().min(3).max(200),
  registrationNo: z.string().optional(),
  description: z.string().min(20),
  focusAreas: z.array(z.string()).min(1).max(5),
  district: z.string().optional(),
  division: z.string().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const existing = await prisma.ngoProfile.findUnique({
    where: { name: parsed.data.name },
  })
  if (existing) {
    return NextResponse.json({ error: "An NGO with this name already exists" }, { status: 409 })
  }

  const ngo = await prisma.ngoProfile.create({
    data: { ...parsed.data, createdBy: session.userId },
  })

  return NextResponse.json({ ngo }, { status: 201 })
}
