"use client"

import { useEffect, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/funding/disbursements")
      const data = (await response.json()) as { disbursements: Disbursement[] }
      setRows(data.disbursements)
    })()
  }, [])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Funding & Disbursement</h1>
      <ul className="space-y-2">
        {paginated.map((row) => (
          <li key={row.id} className="group rounded-lg border-b border-border/60 px-1 py-4 transition-colors hover:bg-muted/40 last:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold transition-colors group-hover:text-primary">{row.project}</h2>
              <Badge variant="outline" className="capitalize">{row.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{row.ministry}</p>
            <p className="mt-2 text-sm font-medium">BDT {row.amountBdt.toLocaleString()}</p>
          </li>
        ))}
      </ul>
      {rows.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
