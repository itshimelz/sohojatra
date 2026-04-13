import { config } from "dotenv"

// Load env variables from .env file
config()

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DIRECT_URL: process.env.DIRECT_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
}

export function assertAuthEnv() {
  const missingVars: string[] = []

  if (!env.DATABASE_URL) missingVars.push("DATABASE_URL")
  if (!env.BETTER_AUTH_SECRET) missingVars.push("BETTER_AUTH_SECRET")
  if (!env.BETTER_AUTH_URL) missingVars.push("BETTER_AUTH_URL")

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    )
  }

  if (process.env.NODE_ENV === "production") {
    const isLocalUrl =
      env.BETTER_AUTH_URL.startsWith("http://localhost") ||
      env.BETTER_AUTH_URL.startsWith("http://127.0.0.1")

    if (!isLocalUrl && !env.BETTER_AUTH_URL.startsWith("https://")) {
      throw new Error("BETTER_AUTH_URL must use HTTPS in production")
    }

    if (env.BETTER_AUTH_SECRET.length < 32) {
      throw new Error(
        "BETTER_AUTH_SECRET must be at least 32 characters in production"
      )
    }
  }
}
