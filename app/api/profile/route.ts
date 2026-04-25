import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      createdAt: true,
      phoneNumber: true,
      trustScore: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: string }
  try {
    body = (await req.json()) as { name?: string }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const updates: { name?: string } = {}
  if (body.name?.trim()) updates.name = body.name.trim()

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true },
  })

  return NextResponse.json(user)
}
