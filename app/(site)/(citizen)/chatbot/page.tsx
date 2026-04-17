"use client"

import { useRef, useState } from "react"
import { ShieldCheck, BookOpenText, PaperPlaneRight, Robot, ArrowClockwise } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  citation?: string
  evidence?: string[]
}

const SUGGESTED_PROMPTS = [
  "How do I submit a concern?",
  "What are my constitutional rights?",
  "Can I track my report status?",
  "How does voting on proposals work?",
  "What is the co-governance process?",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "আস্সালামুয়ালাইকুম! I'm the Sohojatra Rights Chatbot. I can help you with:\n• Citizen rights and constitutional guidance\n• How to submit and track concerns\n• Platform features and workflows\n• Legal procedures and complaint processes\n\nAsk me anything in English or Bangla.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim()
    if (!question) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      })
      const data = (await res.json()) as { reply?: string; citation?: string; evidence?: string[] }
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.reply ?? "I'm sorry, I couldn't find an answer. Please try rephrasing your question.",
        citation: data.citation,
        evidence: data.evidence,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", text: "Network error. Please try again." },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }

  function resetChat() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "আস্সালামুয়ালাইকুম! I'm the Sohojatra Rights Chatbot. Ask me anything about citizen rights, platform features, or civic processes.",
      },
    ])
    setInput("")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Knowledge</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Rights Chatbot</h1>
          <p className="mt-1 text-muted-foreground">Bangla-first constitutional guidance with citations</p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat} className="w-fit">
          <ArrowClockwise className="mr-1.5 size-4" />
          Reset chat
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_300px]">
        {/* Chat panel */}
        <Card className="flex flex-col rounded-2xl" style={{ minHeight: "600px" }}>
          {/* Messages */}
          <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <span className="mr-2 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Robot className="size-4" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm border border-border/60 bg-muted/30"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.citation && (
                    <p className="mt-2 text-xs opacity-70">
                      <BookOpenText className="mr-1 inline size-3" />
                      {msg.citation}
                    </p>
                  )}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
                      {msg.evidence.slice(0, 2).map((e, i) => (
                        <p key={i} className="text-xs opacity-70">• {e}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <span className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Robot className="size-4" />
                </span>
                <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-muted/30 px-4 py-3">
                  <span className="flex gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </CardContent>

          {/* Suggested prompts */}
          <div className="border-t border-border/60 p-3">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => void sendMessage(p)}
                  disabled={loading}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ask about your rights, concerns, or processes…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void sendMessage()}
                disabled={loading}
              />
              <Button
                size="sm"
                className="rounded-xl px-3"
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
              >
                <PaperPlaneRight className="size-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What I can answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p><ShieldCheck className="mr-1.5 inline size-4 text-primary" />Constitutional rights and articles</p>
              <p><BookOpenText className="mr-1.5 inline size-4 text-primary" />Public procedures and ordinances</p>
              <p><Robot className="mr-1.5 inline size-4 text-primary" />Platform features and workflows</p>
              <p>Guided concern submission with context</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Planned sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm text-muted-foreground">
              <p>Bangladesh Constitution (1972)</p>
              <p>RTI Act 2009</p>
              <p>Anti-Corruption ordinances</p>
              <p>City Corporation by-laws</p>
              <p>PDPO 2025 data guidelines</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4">
              <Badge variant="secondary" className="rounded-full">RAG-powered</Badge>
              <p className="mt-2 text-xs text-muted-foreground">
                Answers are retrieved from vetted civic documents and annotated with source citations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
