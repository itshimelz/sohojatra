/**
 * Role-checking utilities for Sohojatra RBAC.
 *
 * Centralises the "who can access admin-level features?" logic
 * so that both server and client code share the same list.
 */

/** Roles that have elevated privileges (admin panel, moderation, etc.) */
const ELEVATED_ROLES = new Set([
  "admin",
  "superadmin",
  "moderator",
  "government_authority",
])

/**
 * Returns `true` if the given role string represents an elevated
 * (non-citizen) role that grants access to admin features.
 */
export function hasElevatedRole(role: string | null | undefined): boolean {
  if (!role) return false
  return ELEVATED_ROLES.has(role)
}
