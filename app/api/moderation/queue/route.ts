import { NextResponse } from "next/server"

import { listModerationQueue } from "@/lib/sohojatra/store"

export async function GET() {
  return NextResponse.json({ items: await listModerationQueue() })
}