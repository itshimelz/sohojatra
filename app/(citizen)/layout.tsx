import type { ReactNode } from "react"

import { requireServerSession } from "@/lib/auth-session"

export default async function CitizenLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireServerSession()
  return children
}
