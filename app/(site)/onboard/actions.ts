"use server"

import { requireServerSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"

export async function completeOnboarding(data: {
  name: string
  email?: string
  dob?: string
  education?: string
}) {
  const session = await requireServerSession()

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      ...(data.email && { email: data.email, emailVerified: false }),
      dob: data.dob ? new Date(data.dob) : null,
      education: data.education || null,
      onboarded: true,
    },
  })

  return { success: true }
}
