import { NextResponse } from "next/server"

import { listModerationQueue } from "@/lib/nagarik/store"

export async function GET() {
  return NextResponse.json({ items: await listModerationQueue() })
}