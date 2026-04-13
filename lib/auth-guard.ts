import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

/**
 * Get the current session using Better Auth's built-in session system.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

/**
 * Require one of the specified roles. Redirects to /unauthorized if
 * the user's role is not in the allowed list.
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  const userRole = (session.user as { role?: string }).role ?? "citizen"

  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized")
  }

  return session
}
