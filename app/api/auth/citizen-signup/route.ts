import { type NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { citizenSignupSchema } from "@/lib/validation/auth"
import { env } from "@/lib/env"

function hashId(raw: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET || "sohojatra-id-key")
    .update(raw.trim())
    .digest("hex")
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const result = citizenSignupSchema.safeParse(body)
  if (!result.success) {
    const first = result.error.issues[0]
    return NextResponse.json(
      { error: first?.message ?? "Validation failed.", field: first?.path[0] ?? null },
      { status: 422 }
    )
  }

  const { idType, idNumber, name, phoneNumber, email, address, password } = result.data
  const normalizedPhone = `+880${phoneNumber}`
  const idHash = hashId(idNumber)

  // Duplicate phone check
  const dupPhone = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
    select: { id: true },
  })
  if (dupPhone) {
    return NextResponse.json(
      { error: "This phone number is already registered.", field: "phoneNumber" },
      { status: 409 }
    )
  }

  // Duplicate ID check
  const dupId = await prisma.user.findFirst({
    where:
      idType === "nid" ? { nidHash: idHash } : { birthCertificateNoHash: idHash },
    select: { id: true },
  })
  if (dupId) {
    return NextResponse.json(
      {
        error: `This ${idType === "nid" ? "NID" : "Birth Certificate Number"} is already registered.`,
        field: "idNumber",
      },
      { status: 409 }
    )
  }

  // Create user via Better Auth email/password
  let signupResponse: Response
  try {
    signupResponse = await auth.api.signUpEmail({
      body: { name, email, password },
      asResponse: true,
    })
  } catch (err) {
    console.error("[citizen-signup] auth error:", err)
    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 }
    )
  }

  if (!signupResponse.ok) {
    try {
      const errBody = (await signupResponse.clone().json()) as {
        message?: string
      }
      const msg = errBody.message ?? ""
      if (/email.*exist|already.*exist|already.*register/i.test(msg)) {
        return NextResponse.json(
          { error: "This email is already registered.", field: "email" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: msg || "Signup failed. Please try again." },
        { status: signupResponse.status }
      )
    } catch {
      return NextResponse.json(
        { error: "Signup failed. Please try again." },
        { status: signupResponse.status }
      )
    }
  }

  // Attach extended profile fields after user is created
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneNumber: normalizedPhone,
          address,
          ...(idType === "nid"
            ? { nidHash: idHash }
            : { birthCertificateNoHash: idHash }),
        },
      })
    }
  } catch (err) {
    // Non-fatal: user account created, profile fields incomplete
    console.warn("[citizen-signup] profile update failed:", err)
  }

  return signupResponse
}
