import { NextResponse } from "next/server"

import { smsFallback } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; message?: string }
  if (!body.phone || !body.message) {
    return NextResponse.json({ error: "phone and message are required" }, { status: 400 })
  }

  return NextResponse.json({ sms: smsFallback({ phone: body.phone, message: body.message }) }, { status: 201 })
}
