export type ChatRole = "user" | "assistant" | "system"
export type ChatMessage = { role: ChatRole; content: string }

export type LlmChatOptions = {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}
