import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

/**
 * Get the current session using Better Auth's built-in session API.
 * Returns the full session or null if not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

/**
 * Require an authenticated session. Redirects to /login if not authenticated.
 */
export async function requireServerSession() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}
