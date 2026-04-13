import { BookOpenText, ChatCircleText, ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { chatbotMessages } from "@/lib/nagarik/mock"

const prompts = [
  "How do I submit a concern?",
  "Can I hide my name publicly?",
  "What happens after a proposal is approved?",
]

export default function ChatbotPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit rounded-full">Constitutional Chatbot</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bangla-first rights guidance with citations
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              This is a RAG-style front end for rights, complaint submission, and
              concern tracking workflows.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-3xl border border-border/60 bg-muted/20 p-4">
              {chatbotMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-background border border-border/60"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.citation ? (
                    <p className="mt-2 text-xs opacity-80">Cited: {message.citation}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <Button key={prompt} variant="outline" className="rounded-full text-left whitespace-normal">
                  {prompt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <h2 className="text-xl font-semibold">What it can answer</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><ShieldCheck className="mr-2 inline size-4 text-primary" />Citizen rights and process guidance</p>
              <p><BookOpenText className="mr-2 inline size-4 text-primary" />Constitutional articles and public procedures</p>
              <p><Sparkle className="mr-2 inline size-4 text-primary" />Guided concern submission with context</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <h2 className="text-xl font-semibold">Session memory</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><ChatCircleText className="mr-2 inline size-4 text-primary" />Keeps a short live chat window for follow-up questions.</p>
              <p>Planned retrieval sources: constitution, ordinances, circulars, and concern history.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}