/**
 * API Guard — Server-side session verification & RBAC for API routes.
 *
 * This module provides helper functions that every mutating API route
 * MUST call before executing business logic. It solves three problems:
 *
 *   1. **Authentication** — Verifies the caller has a valid Better Auth
 *      session. Rejects unauthenticated requests with 401.
 *
 *   2. **Identity extraction** — Returns the trusted user ID and role
 *      from the session, so routes never need to trust the JSON body
 *      for identity information.
 *
 *   3. **RBAC** — Optional role-gating. Routes can specify which roles
 *      are allowed to call them. Unauthorized roles get 403.
 *
 * Usage:
 *   import { requireSession, requireRole } from "@/lib/api-guard"
 *
 *   // In any POST handler:
 *   const session = await requireSession(request)
 *   if (session instanceof Response) return session // 401
 *
 *   // For admin-only routes:
 *   const session = await requireRole(request, ["admin", "superadmin"])
 *   if (session instanceof Response) return session // 401 or 403
 */

import { getServerSession } from "@/lib/auth-session"

// ── Types ────────────────────────────────────────────────────────────────────

/** The verified session payload returned to API route handlers. */
export type VerifiedSession = {
  /** The user's unique ID from the database. */
  userId: string
  /** The user's display name. */
  userName: string
  /** The user's role (citizen, moderator, admin, superadmin). */
  userRole: string
  /** The user's email address. */
  userEmail: string
  /** The full session object from getServerSession. */
  raw: Exclude<Awaited<ReturnType<typeof getServerSession>>, null>
}

// ── Role hierarchy (higher index = more privilege) ───────────────────────────

const ROLE_HIERARCHY = ["citizen", "moderator", "admin", "superadmin"] as const

/**
 * Check if a given role is at least as privileged as another.
 * Example: hasMinRole("admin", "moderator") → true
 */
export function hasMinRole(
  userRole: string,
  requiredRole: (typeof ROLE_HIERARCHY)[number]
): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole as (typeof ROLE_HIERARCHY)[number])
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  // Unknown roles are treated as lowest privilege
  if (userIndex === -1) return false
  return userIndex >= requiredIndex
}

// ── Core Guards ──────────────────────────────────────────────────────────────

/**
 * Verify that the request has a valid Better Auth session.
 *
 * @returns A `VerifiedSession` on success, or a `Response` (401) on failure.
 *          The caller should check `instanceof Response` and return it directly.
 *
 * @example
 *   const session = await requireSession(request)
 *   if (session instanceof Response) return session
 *   // session.userId is now safe to use
 */
export async function requireSession(
  _request: Request
): Promise<VerifiedSession | Response> {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return Response.json(
        {
          code: "UNAUTHENTICATED",
          message: "You must be logged in to perform this action.",
        },
        { status: 401 }
      )
    }

    return {
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      userRole: session.user.role ?? "citizen",
      userEmail: session.user.email ?? "",
      raw: session,
    }
  } catch (error) {
    console.error("[api-guard] Session verification failed:", error)
    return Response.json(
      {
        code: "AUTH_ERROR",
        message: "Session verification failed. Please log in again.",
      },
      { status: 401 }
    )
  }
}

/**
 * Verify that the request has a valid session AND the user holds one
 * of the specified roles.
 *
 * @param allowedRoles - Array of role names that are permitted.
 * @returns A `VerifiedSession` on success, or a `Response` (401/403) on failure.
 *
 * @example
 *   const session = await requireRole(request, ["admin", "superadmin", "moderator"])
 *   if (session instanceof Response) return session
 */
export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<VerifiedSession | Response> {
  const session = await requireSession(request)

  // If requireSession returned an error Response, propagate it
  if (session instanceof Response) return session

  // Check if user's role is in the allowed list
  if (!allowedRoles.includes(session.userRole)) {
    return Response.json(
      {
        code: "FORBIDDEN",
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${session.userRole}.`,
      },
      { status: 403 }
    )
  }

  return session
}

/**
 * Optional session check — returns the verified session if the user is
 * logged in, or `null` if they are not. Does NOT return a 401 Response.
 *
 * Use this for routes where authentication is optional (e.g., public
 * GET routes that show extra data for logged-in users).
 */
export async function optionalSession(): Promise<VerifiedSession | null> {
  try {
    const session = await getServerSession()

    if (!session?.user) return null

    return {
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      userRole: session.user.role ?? "citizen",
      userEmail: session.user.email ?? "",
      raw: session,
    }
  } catch {
    return null
  }
}
