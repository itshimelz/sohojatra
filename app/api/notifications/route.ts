/**
 * GET/POST /api/notifications — User notifications.
 *
 * SECURITY:
 *   - GET: Requires auth. Users can only see their own notifications.
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Creating notifications is a system/admin action, not a citizen one.
 */
import { NextResponse } from "next/server"

import { requireSession, requireRole } from "@/lib/api-guard"
import { createNotification, listNotifications } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  // ── Auth: Must be logged in to view notifications ────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const { searchParams } = new URL(request.url)
  const channelParam = searchParams.get("channel")
  const channel =
    channelParam === "push" ||
    channelParam === "sms" ||
    channelParam === "email" ||
    channelParam === "in-app"
      ? channelParam
      : undefined

  // ── Users can only view their OWN notifications ──────────
  const notifications = await listNotifications({
    userId: session.userId,
    channel,
  })

  return NextResponse.json({
    count: notifications.length,
    notifications,
  })
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can create notifications ───────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

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
