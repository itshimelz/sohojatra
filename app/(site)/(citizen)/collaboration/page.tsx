"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Thread = {
  id: string
  title: string
  messages: Array<{ id: string; author: string; text: string }>
}

export default function CollaborationPage() {
  const [threads, setThreads] = useState<Thread[]>([])

  async function refresh() {
    const response = await fetch("/api/collaboration/threads")
    const data = (await response.json()) as { threads: Thread[] }
    setThreads(data.threads)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function createThread() {
    await fetch("/api/collaboration/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-thread", title: "Citizen-Govt collaborative room" }),
    })

    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Collaborative Workspace</h1>
        <Button onClick={() => void createThread()}>Create Thread</Button>
      </div>

      <div className="grid gap-3">
        {threads.map((thread) => (
          <Card key={thread.id}>
            <CardHeader>
              <CardTitle>{thread.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Messages: {thread.messages.length}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
