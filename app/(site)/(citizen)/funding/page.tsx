"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Disbursement = {
  id: string
  project: string
  ministry: string
  amountBdt: number
  releasedAt: string
  status: "released" | "pending" | "audit"
}

export default function FundingPage() {
  const [rows, setRows] = useState<Disbursement[]>([])

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/funding/disbursements")
      const data = (await response.json()) as { disbursements: Disbursement[] }
      setRows(data.disbursements)
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Funding & Disbursement</h1>
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardHeader>
              <CardTitle>{row.project}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {row.ministry} | BDT {row.amountBdt.toLocaleString()} | {row.status}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
