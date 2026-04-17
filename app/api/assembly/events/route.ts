import { NextResponse } from "next/server"

import { createAssemblyEvent, listAssemblyEvents } from "@/lib/sohojatra/store"

export async function GET() {
  return NextResponse.json({ events: await listAssemblyEvents() })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string
    date?: string
    time?: string
    location?: string
    organizer?: string
    topic?: string
    agenda?: string
    linkedConcernIds?: string[]
  }

  if (!body.title || !body.date || !body.time || !body.location || !body.organizer || !body.topic) {
    return NextResponse.json(
      { error: "title, date, time, location, organizer, topic are required" },
      { status: 400 }
    )
  }

  const event = await createAssemblyEvent({
    title: body.title,
    date: body.date,
    time: body.time,
    location: body.location,
    organizer: body.organizer,
    topic: body.topic,
    agenda: body.agenda,
    linkedConcernIds: body.linkedConcernIds,
  })

  return NextResponse.json({ event }, { status: 201 })
}
