import {
  assertProviderConfigured,
  defaultChatbotProviderFromEnv,
  type ChatbotProviderId,
} from "./chatbot-providers"
import { geminiComplete, geminiStream } from "./gemini"
import { groqComplete, groqStream } from "./groq"
import type { ChatMessage, LlmChatOptions } from "./llm-chat-types"
import { openrouterComplete, openrouterStream } from "./openrouter"
import { RightsChatConfigError } from "./rights-chat-config-error"

export type { ChatbotProviderId } from "./chatbot-providers"

function resolveProvider(
  requested: ChatbotProviderId | undefined,
): ChatbotProviderId {
  if (requested) {
    assertProviderConfigured(requested)
    return requested
  }
  const fallback = defaultChatbotProviderFromEnv()
  if (fallback) return fallback
  throw new RightsChatConfigError(
    "No LLM API key configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY in .env.local (or pass provider in the request).",
  )
}

export async function rightsLlmComplete(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
  provider?: ChatbotProviderId,
): Promise<string> {
  const p = resolveProvider(provider)
  if (p === "gemini") return geminiComplete(messages, opts)
  if (p === "openrouter") return openrouterComplete(messages, opts)
  return groqComplete(messages, opts)
}

export async function* rightsLlmStream(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
  provider?: ChatbotProviderId,
): AsyncGenerator<string, void, void> {
  const p = resolveProvider(provider)
  if (p === "gemini") {
    yield* geminiStream(messages, opts)
  } else if (p === "openrouter") {
    yield* openrouterStream(messages, opts)
  } else {
    yield* groqStream(messages, opts)
  }
}
