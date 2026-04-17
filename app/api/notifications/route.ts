import { NextResponse } from "next/server"

import { createNotification, listNotifications } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") ?? undefined
  const channelParam = searchParams.get("channel")
  const channel =
    channelParam === "push" ||
    channelParam === "sms" ||
    channelParam === "email" ||
    channelParam === "in-app"
      ? channelParam
      : undefined

  const notifications = await listNotifications({
    userId,
    channel,
  })

  return NextResponse.json({
    count: notifications.length,
    notifications,
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string
    channel?: "push" | "sms" | "email" | "in-app"
    subject?: string
    body?: string
    status?: "pending" | "sent" | "failed"
    meta?: Record<string, unknown>
  }

  if (!body.userId || !body.subject || !body.body) {
    return NextResponse.json(
      { error: "userId, subject, body are required" },
      { status: 400 }
    )
  }

  const notification = await createNotification({
    userId: body.userId,
    channel: body.channel ?? "in-app",
    subject: body.subject,
    body: body.body,
    status: body.status,
    meta: body.meta,
  })

  return NextResponse.json(notification, { status: 201 })
}
