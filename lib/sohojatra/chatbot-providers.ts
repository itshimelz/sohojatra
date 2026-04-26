import { RightsChatConfigError } from "./rights-chat-config-error"

export const CHATBOT_PROVIDER_IDS = ["gemini", "groq", "openrouter"] as const
export type ChatbotProviderId = (typeof CHATBOT_PROVIDER_IDS)[number]

export function isChatbotProviderId(value: string): value is ChatbotProviderId {
  return (CHATBOT_PROVIDER_IDS as readonly string[]).includes(value)
}

export type ChatbotProviderOption = {
  id: ChatbotProviderId
  label: string
  configured: boolean
}

export function getChatbotProviderOptions(): ChatbotProviderOption[] {
  return [
    {
      id: "gemini",
      label: "Google Gemini",
      configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    },
    {
      id: "groq",
      label: "Groq (Llama)",
      configured: Boolean(process.env.GROQ_API_KEY?.trim()),
    },
    {
      id: "openrouter",
      label: "OpenRouter (Gemma 4)",
      configured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    },
  ]
}

/** When the client omits `provider`, match previous env priority. */
export function defaultChatbotProviderFromEnv(): ChatbotProviderId | null {
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini"
  if (process.env.GROQ_API_KEY?.trim()) return "groq"
  if (process.env.OPENROUTER_API_KEY?.trim()) return "openrouter"
  return null
}

export function assertProviderConfigured(id: ChatbotProviderId): void {
  const opt = getChatbotProviderOptions().find((p) => p.id === id)
  if (!opt?.configured) {
    const keyHint =
      id === "gemini"
        ? "GEMINI_API_KEY"
        : id === "groq"
          ? "GROQ_API_KEY"
          : "OPENROUTER_API_KEY"
    throw new RightsChatConfigError(
      `Provider "${id}" is not configured on the server. Set ${keyHint} in .env.local.`,
    )
  }
}
