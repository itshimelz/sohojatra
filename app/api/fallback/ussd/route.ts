import { NextResponse } from "next/server"

import { ussdReply } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; text?: string }
  if (!body.phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 })
  }

  return NextResponse.json({ reply: ussdReply({ phone: body.phone, text: body.text ?? "" }) })
}
