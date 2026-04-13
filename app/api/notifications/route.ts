import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const channel = searchParams.get("channel")

  // In production, filter notifications by userId and channel
  // For now, return a list of sample notifications
  const notifications = [
    {
      id: "n-1",
      userId: userId || "all",
      channel: channel || "in-app",
      subject: "Your concern has been escalated",
      body: "Your report about the open manhole near Mirpur 10 has been escalated to the ward commissioner.",
      status: "sent",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "n-2",
      userId: userId || "all",
      channel: channel || "email",
      subject: "New research grant available",
      body: "New grant opportunity: Flood prediction models. Deadline: 15 May 2026",
      status: "sent",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "n-3",
      userId: userId || "all",
      channel: channel || "sms",
      subject: "Proposal voting update",
      body: "Proposal voting milestone reached. Your votes matter.",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ]

  return NextResponse.json({
    count: notifications.length,
    notifications,
  })
}

export async function POST(request: Request) {
  const body = await request.json()

  const notification = {
    id: `n-${Date.now()}`,
    userId: body.userId,
    channel: body.channel || "in-app",
    subject: body.subject,
    body: body.body,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  // In production, persist to database and queue for delivery
  return NextResponse.json(notification, { status: 201 })
}