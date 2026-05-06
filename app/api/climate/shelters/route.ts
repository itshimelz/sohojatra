import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const CreateShelterSchema = z.object({
  name: z.string().min(3).max(200),
  division: z.string().min(1),
  district: z.string().min(1),
  upazila: z.string().optional(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  capacity: z.number().int().min(0),
  currentOccupied: z.number().int().min(0).default(0),
  contactPhone: z.string().optional(),
  facilities: z.array(z.string()).default([]),
  isOpen: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const openOnly = searchParams.get("openOnly") !== "false"

  const shelters = await prisma.cycloneShelter.findMany({
    where: {
      ...(district ? { district } : {}),
      ...(openOnly ? { isOpen: true } : {}),
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ shelters })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CreateShelterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const shelter = await prisma.cycloneShelter.create({ data: parsed.data })
  return NextResponse.json({ shelter }, { status: 201 })
}
