import { geminiComplete, geminiStream } from "./gemini"
import { groqComplete, groqStream } from "./groq"
import type { ChatMessage, LlmChatOptions } from "./llm-chat-types"
import { RightsChatConfigError } from "./rights-chat-config-error"

function provider(): "gemini" | "groq" {
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini"
  if (process.env.GROQ_API_KEY?.trim()) return "groq"
  throw new RightsChatConfigError(
    "No LLM API key configured. Set GEMINI_API_KEY (Google AI Studio) or GROQ_API_KEY in .env.local for the rights chatbot.",
  )
}

export async function rightsLlmComplete(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
): Promise<string> {
  return provider() === "gemini"
    ? geminiComplete(messages, opts)
    : groqComplete(messages, opts)
}

export async function* rightsLlmStream(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
): AsyncGenerator<string, void, void> {
  if (provider() === "gemini") {
    yield* geminiStream(messages, opts)
  } else {
    yield* groqStream(messages, opts)
  }
}
