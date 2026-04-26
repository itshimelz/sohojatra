import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

type Article = {
  number: string
  title: string
  part: string
  text: string
}

type Payload = { articles?: Article[] } | Article[]

/**
 * Public read-only bundle of constitution articles keyed by article number
 * for client-side citation previews (chatbot chips).
 */
export async function GET() {
  const file = path.join(process.cwd(), "data", "bd-constitution.json")
  const raw = await readFile(file, "utf8")
  const payload = JSON.parse(raw) as Payload
  const list = Array.isArray(payload) ? payload : payload.articles ?? []

  const byNumber: Record<string, Article> = {}
  for (const a of list) {
    if (!a?.number || typeof a.text !== "string") continue
    const key = String(a.number)
    byNumber[key] = {
      number: key,
      title: String(a.title ?? ""),
      part: String(a.part ?? ""),
      text: a.text,
    }
  }

  return NextResponse.json(
    { byNumber },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  )
}
