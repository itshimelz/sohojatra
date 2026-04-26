"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Scales,
  PaperPlaneTilt,
  ArrowCounterClockwise,
  BookOpen,
  Lightning,
  Warning,
  Spinner,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "assistant" | "user"
  text: string
  citations?: string[]
  pending?: boolean
  error?: boolean
}

const SUGGESTED = [
  "Can I be arrested without being told why?",
  "What does Article 27 say about equality?",
  "আমার বাক স্বাধীনতা আছে কি?",
  "What rights do I have if detained?",
  "আমার ঘরে পুলিশ কি বিনা ওয়ারেন্টে ঢুকতে পারে?",
  "Who guarantees freedom of religion?",
]

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "আস্সালামুয়ালাইকুম! I'm your constitutional rights guide for Bangladesh. Ask me about your fundamental rights, any Article from the Constitution, or what to do in legal situations — in English or Bangla.",
  citations: [],
}

// Strip any trailing "Citations: ..." block the model might still emit
function cleanAnswer(text: string): string {
  return text
    .replace(/\n*\*?Citations?:?\*?\s*[\[\w\s,\]•\-–—]+$/gi, "")
    .replace(/\n*Citations:\s*$/gi, "")
    .trim()
}

// Render text with [Article N] as highlighted inline chips
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[Article\s+\d+[A-Za-z]?\])/gi)
  return (
    <>
      {parts.map((part, i) =>
        /^\[Article\s+\d+[A-Za-z]?\]$/i.test(part) ? (
          <span
            key={i}
            className="mx-0.5 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/20"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-2 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function CitationPills({ citations }: { citations: string[] }) {
  if (!citations.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((c) => {
        const short = c.replace(/ — Constitution of Bangladesh$/, "")
        return (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium text-primary/75"
          >
            <BookOpen className="size-2.5 shrink-0" weight="bold" />
            {short}
          </span>
        )
      })}
    </div>
  )
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function send(question: string) {
    const trimmed = question.trim()
    if (!trimmed || isStreaming) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: trimmed }
    const assistantId = `a-${Date.now()}`
    const placeholder: Message = { id: assistantId, role: "assistant", text: "", pending: true }

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.text }))

    setMessages((prev) => [...prev, userMsg, placeholder])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, messages: history, stream: true }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""
      let citations: string[] = []

      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? ""

          for (const part of parts) {
            const lines = part.split("\n")
            const event = lines.find((l) => l.startsWith("event: "))?.slice(7)
            const data = lines.find((l) => l.startsWith("data: "))?.slice(6)
            if (!event || !data) continue

            let payload: { text?: string; citations?: string[]; message?: string }
            try {
              payload = JSON.parse(data) as typeof payload
            } catch {
              continue
            }

            if (event === "citations" && payload.citations) {
              citations = payload.citations
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, citations } : m)),
              )
            } else if (event === "delta" && payload.text) {
              accumulated += payload.text
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: accumulated, pending: true } : m,
                ),
              )
            } else if (event === "error") {
              await reader.cancel()
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        pending: false,
                        error: true,
                        text:
                          payload.message ??
                          "The chatbot is offline — set GEMINI_API_KEY or GROQ_API_KEY in .env.",
                      }
                    : m,
                ),
              )
              return
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, pending: false, text: cleanAnswer(accumulated) }
            : m,
        ),
      )
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      const msg =
        err instanceof Error
          ? err.message
          : "Connection interrupted — please try again."
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, pending: false, error: true, text: msg } : m,
        ),
      )
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function clearChat() {
    abortRef.current?.abort()
    setMessages([WELCOME])
    setInput("")
    setIsStreaming(false)
  }

  const showSuggested = messages.length <= 1

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-linear-to-b from-background to-muted/20">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-sm">
            <Scales className="size-5 text-primary" weight="duotone" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight">Rights Assistant</h1>
              <Badge
                variant="secondary"
                className="hidden h-5 rounded-full px-2 text-[10px] sm:flex"
              >
                <Lightning className="mr-1 size-2.5" weight="fill" />
                RAG · Gemini / Groq
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bangladesh Constitution · BM25 · server LLM (env)
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowCounterClockwise className="size-3.5" weight="bold" />
          <span className="hidden sm:inline">New chat</span>
        </Button>
      </header>

      {/* ── Message area ───────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto max-w-2xl space-y-1">
          {/* Suggested prompts — shown only before first user message */}
          <AnimatePresence>
            {showSuggested && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="mb-6 space-y-3"
              >
                <p className="text-center text-xs font-medium text-muted-foreground">
                  Try asking
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTED.map((p) => (
                    <button
                      key={p}
                      onClick={() => void send(p)}
                      disabled={isStreaming}
                      className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-left text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat messages */}
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "flex gap-2.5 py-1",
                  message.role === "user" && "flex-row-reverse",
                )}
              >
                {/* Bot avatar */}
                {message.role === "assistant" && (
                  <div className="mt-1 shrink-0">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl ring-1",
                        message.error
                          ? "bg-destructive/10 ring-destructive/20 text-destructive"
                          : "bg-linear-to-br from-primary/20 to-primary/5 ring-primary/20 text-primary",
                      )}
                    >
                      {message.error ? (
                        <Warning className="size-4" weight="duotone" />
                      ) : (
                        <Scales className="size-4" weight="duotone" />
                      )}
                    </div>
                  </div>
                )}

                {/* Bubble + citations */}
                <div
                  className={cn(
                    "flex max-w-[82%] flex-col",
                    message.role === "user" && "items-end",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground shadow-md"
                        : message.error
                          ? "rounded-tl-sm border border-destructive/30 bg-destructive/8 text-destructive"
                          : "rounded-tl-sm border border-border/50 bg-card shadow-sm",
                    )}
                  >
                    {/* Typing state: no text yet */}
                    {message.pending && !message.text ? (
                      <TypingDots />
                    ) : (
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {message.role === "assistant" ? (
                          <RichText text={message.text} />
                        ) : (
                          message.text
                        )}
                        {/* Streaming cursor */}
                        {message.pending && message.text && (
                          <span className="ml-0.5 inline-block size-0.75 animate-pulse rounded-full bg-current align-middle opacity-60" />
                        )}
                      </p>
                    )}
                  </div>

                  {/* Citation pills — only for finished bot messages */}
                  {message.role === "assistant" &&
                    !message.pending &&
                    !message.error &&
                    message.citations &&
                    message.citations.length > 0 && (
                      <CitationPills citations={message.citations} />
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div className="h-2" />
        </div>
      </div>

      {/* ── Input dock ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/50 bg-background/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send(input)
          }}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your rights, an Article, or a situation… (English or Bangla)"
            rows={1}
            disabled={isStreaming}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-border/60 bg-card/80 py-3 text-sm shadow-sm transition-all focus:border-primary/50 focus:shadow-md"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="size-11 shrink-0 rounded-2xl shadow-sm transition-all hover:shadow-md"
          >
            {isStreaming ? (
              <Spinner className="size-4 animate-spin" weight="bold" />
            ) : (
              <PaperPlaneTilt className="size-4" weight="fill" />
            )}
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-muted-foreground/50">
          Grounded in the Bangladesh Constitution · Not legal advice · Consult a lawyer for your situation
        </p>
      </div>
    </div>
  )
}
