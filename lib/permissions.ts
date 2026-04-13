import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/admin/access"

/**
 * Sohojatra RBAC — Resources & Actions
 *
 * Merges Better Auth's default admin statements (user, session)
 * with app-specific resources (concern, report).
 */
export const statement = {
  ...defaultStatements,
  concern: ["create", "read", "update", "delete", "moderate", "assign"],
  report: ["view", "export"],
} as const

export const ac = createAccessControl(statement)

// ── Role definitions ────────────────────────────────────────

/** Default role — regular citizens */
export const citizen = ac.newRole({
  concern: ["create", "read"],
})

/** Moderators — review, update, moderate, and delete concerns */
export const moderator = ac.newRole({
  concern: ["create", "read", "update", "delete", "moderate"],
})

/** Admins — full concern control + all default admin capabilities */
export const admin = ac.newRole({
  concern: ["create", "read", "update", "delete", "moderate", "assign"],
  report: ["view"],
  ...adminAc.statements,
})

/** Superadmins — everything + impersonate admins + export reports */
export const superadmin = ac.newRole({
  concern: ["create", "read", "update", "delete", "moderate", "assign"],
  report: ["view", "export"],
  ...adminAc.statements,
  user: ["impersonate-admins", ...adminAc.statements.user],
})
