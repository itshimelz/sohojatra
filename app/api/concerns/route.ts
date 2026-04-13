import { NextResponse } from "next/server"

import { createConcern, listConcerns } from "@/lib/sohojatra/store"

export async function GET() {
  return NextResponse.json({ concerns: await listConcerns() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const concern = await createConcern({
    title: body.title,
    description: body.description,
    authorName: body.authorName,
    locationLat: Number(body.locationLat),
    locationLng: Number(body.locationLng),
    location: body.location,
    photos: Array.isArray(body.photos) ? body.photos : [],
  })

  return NextResponse.json({ concern }, { status: 201 })
}