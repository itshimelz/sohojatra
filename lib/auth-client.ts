import { createAuthClient } from "better-auth/react"
import { phoneNumberClient } from "better-auth/client/plugins"

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
  plugins: [phoneNumberClient()],
})

export const { signIn, signUp, useSession } = authClient
