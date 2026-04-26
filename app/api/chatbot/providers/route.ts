import { NextResponse } from "next/server"

import { getChatbotProviderOptions } from "@/lib/sohojatra/chatbot-providers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET — which chatbot backends have API keys configured (no secrets exposed).
 */
export async function GET() {
  return NextResponse.json({ providers: getChatbotProviderOptions() })
}
