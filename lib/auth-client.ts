import { createAuthClient } from "better-auth/react"
import { phoneNumberClient } from "better-auth/client/plugins"
import { adminClient } from "better-auth/client/plugins"
import {
  ac,
  citizen,
  moderator,
  admin,
  superadmin,
} from "@/lib/permissions"

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL

if (
  process.env.NODE_ENV === "production" &&
  publicAppUrl &&
  !publicAppUrl.startsWith("https://") &&
  !publicAppUrl.startsWith("http://localhost") &&
  !publicAppUrl.startsWith("http://127.0.0.1")
) {
  throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production")
}

export const authClient = createAuthClient({
  ...(publicAppUrl ? { baseURL: publicAppUrl } : {}),
  plugins: [
    phoneNumberClient(),
    adminClient({
      ac,
      roles: {
        citizen,
        moderator,
        admin,
        superadmin,
      },
    }),
  ],
})

export const { signIn, signUp, useSession } = authClient
