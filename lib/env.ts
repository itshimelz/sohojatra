import { config } from "dotenv"

// Load env variables from .env file
config()

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DIRECT_URL: process.env.DIRECT_URL ?? "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
  SSL_SMS_API_URL: process.env.SSL_SMS_API_URL ?? "",
  SSL_SMS_API_KEY:
    process.env.SSL_SMS_API_KEY ?? process.env.SSL_SMS_API_TOKEN ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM_EMAIL:
    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  REDIS_URL: process.env.REDIS_URL ?? "",
  REDIS_HOST: process.env.REDIS_HOST ?? "",
  REDIS_PORT: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  REDIS_USERNAME: process.env.REDIS_USERNAME ?? "default",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? "",
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  GROQ_MODEL: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  /** Google AI Studio / Gemini API key. When set, the rights chatbot uses Gemini instead of Groq. */
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  VECTORIZER_API_ID: process.env.VECTORIZER_API_ID ?? "",
  VECTORIZER_API_SECRET: process.env.VECTORIZER_API_SECRET ?? "",
}

export function assertAuthEnv() {
  const missingVars: string[] = []

  if (!env.DATABASE_URL) missingVars.push("DATABASE_URL")
  if (!env.BETTER_AUTH_SECRET) missingVars.push("BETTER_AUTH_SECRET")
  if (!env.BETTER_AUTH_URL) missingVars.push("BETTER_AUTH_URL")
  if (!env.SSL_SMS_API_URL) missingVars.push("SSL_SMS_API_URL")
  if (!env.SSL_SMS_API_KEY) missingVars.push("SSL_SMS_API_KEY or SSL_SMS_API_TOKEN")

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
