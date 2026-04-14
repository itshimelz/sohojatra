import { NextResponse } from "next/server"
import { z } from "zod"

import { getServerSession } from "@/lib/auth-session"

const privilegedRoles = new Set(["admin", "superadmin", "moderator"])

export function isPrivilegedRole(role: unknown) {
  return typeof role === "string" && privilegedRoles.has(role)
}

export async function requireApiSession() {
  const session = await getServerSession()

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { ok: true as const, session }
}

export async function parseJsonBody(request: Request) {
  try {
    const body = await request.json()
    return { ok: true as const, body }
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    }
  }
}

export function validateBody<T extends z.ZodTypeAny>(schema: T, body: unknown) {
  const result = schema.safeParse(body)

  if (!result.success) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid input" }, { status: 400 }),
    }
  }

  return { ok: true as const, data: result.data }
}
