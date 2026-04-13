"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type LeaderboardEntry = {
  id: string
  university: string
  solvedConcerns: number
  acceptedResearch: number
  score: number
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/leaderboard/universities")
      const data = (await response.json()) as { leaderboard: LeaderboardEntry[] }
      setRows(data.leaderboard)
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">University Leaderboard</h1>
      <div className="grid gap-3">
        {rows.map((item, index) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>
                #{index + 1} {item.university}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Solved: {item.solvedConcerns} | Accepted: {item.acceptedResearch} | Score: {item.score}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
