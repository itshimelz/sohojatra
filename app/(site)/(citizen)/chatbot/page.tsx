"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/lib/i18n/context"

type Message = {
  id: string
  role: "assistant" | "user"
  text: string
  citations?: string[]
  pending?: boolean
  error?: boolean
}

const SAMPLE_PROMPTS_EN = [
  "Can I be arrested without being told why?",
  "Who guarantees freedom of speech in Bangladesh?",
  "What does Article 27 say?",
  "আমার ঘরে পুলিশ কি বিনা ওয়ারেন্টে ঢুকতে পারে?",
]

const SAMPLE_PROMPTS_BN = [
  "কারণ না জানিয়ে কি আমাকে গ্রেফতার করা যাবে?",
  "বাংলাদেশে বাক স্বাধীনতার নিশ্চয়তা কে দেয়?",
  "আর্টিকেল ২৭ কী বলে?",
  "আমার ঘরে পুলিশ কি বিনা ওয়ারেন্টে ঢুকতে পারে?",
]

export default function ChatbotPage() {
  const t = useT().chatbot
  const isBn = t.ask === "জিজ্ঞেস করুন"
  const prompts = isBn ? SAMPLE_PROMPTS_BN : SAMPLE_PROMPTS_EN

  const welcome: Message = {
    id: "welcome",
    role: "assistant",
    text: t.welcome,
    citations: [t.welcomeCitation],
  }

  const [messages, setMessages] = useState<Message[]>([welcome])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
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

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, messages: history, stream: true }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Chat failed: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""
      let citations: string[] = []

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
          const payload = JSON.parse(data) as {
            text?: string
            citations?: string[]
            message?: string
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
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, pending: false, error: true, text: payload.message ?? t.offlineError }
                  : m,
              ),
            )
            return
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, pending: false, text: accumulated } : m,
        ),
      )
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                pending: false,
                error: true,
                text: error instanceof Error ? error.message : t.genericError,
              }
            : m,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-border/50 bg-background/50 p-6 sm:p-8 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-sm">
          <div className="space-y-3 pb-6 text-center">
            <Badge variant="secondary" className="mx-auto w-fit rounded-full">
              {t.badge}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">{t.description}</p>
          </div>

          <div className="space-y-4">
            <div
              ref={scrollRef}
              className="max-h-[520px] space-y-3 overflow-y-auto rounded-3xl border border-border/50 bg-muted/20 p-4 sm:p-6"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground shadow-sm"
                      : message.error
                        ? "border border-destructive/40 bg-destructive/10 text-destructive shadow-sm"
                        : "bg-background border border-border/60 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {message.text}
                    {message.pending && !message.text ? (
                      <span className="inline-flex gap-1 align-middle">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                      </span>
                    ) : null}
                  </p>
                  {message.citations && message.citations.length > 0 ? (
                    <div className="mt-2 space-y-1 text-[11px] opacity-80">
                      {message.citations.map((citation) => (
                        <p key={citation} className="decoration-primary/50 underline underline-offset-2">
                          {t.cited} {citation}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <form
              onSubmit={(event) => { event.preventDefault(); void send(input) }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t.placeholder}
                rows={2}
                className="flex-1 rounded-3xl"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void send(input)
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isStreaming || input.trim().length === 0}
                className="rounded-full sm:self-end"
              >
                {isStreaming ? t.thinking : t.ask}
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {prompts.map((prompt) => (
                <motion.div key={prompt} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    disabled={isStreaming}
                    onClick={() => void send(prompt)}
                    className="rounded-full text-left whitespace-normal"
                  >
                    {prompt}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
