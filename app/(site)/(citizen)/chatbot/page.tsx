"use client"

import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { chatbotMessages } from "@/lib/sohojatra/mock"

const prompts = [
  "How do I submit a concern?",
  "Can I hide my name publicly?",
  "What happens after a proposal is approved?",
]

export default function ChatbotPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-border/50 bg-background/50 p-6 sm:p-8 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-sm">
          <div className="space-y-3 pb-6 text-center">
            <Badge variant="secondary" className="mx-auto w-fit rounded-full">Constitutional Chatbot</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bangla-first rights guidance with citations
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              This is a RAG-style front end for rights, complaint submission, and
              concern tracking workflows.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-3 rounded-3xl border border-border/50 bg-muted/20 p-4 sm:p-6">
              {chatbotMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground shadow-sm"
                      : "bg-background border border-border/60 shadow-sm"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.citation ? (
                    <p className="mt-2 text-[11px] opacity-80 decoration-primary/50 underline underline-offset-2">Cited: {message.citation}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {prompts.map((prompt) => (
                <motion.div key={prompt} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="rounded-full text-left whitespace-normal">
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