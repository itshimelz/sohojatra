import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-session"
import { hasElevatedRole } from "@/lib/roles"

/**
 * Server-side layout guard for the admin route group.
 *
 * - Unauthenticated users → redirected to /login
 * - Citizens (no elevated role) → redirected to /unauthorized
 * - Elevated users → render children normally
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as { role?: string }).role

  if (!hasElevatedRole(role)) {
    redirect("/unauthorized")
  }

  return <>{children}</>
}
