import { NextResponse } from "next/server"

import { listConcerns } from "@/lib/sohojatra/store"
import type { Concern } from "@/lib/concerns/types"

export async function GET() {
  const concerns = await listConcerns()
  const cells = concerns.map((concern: Concern) => ({
    lat: concern.location.lat,
    lng: concern.location.lng,
    intensity: Math.max(1, concern.upvotes - concern.downvotes),
    concernId: concern.id,
  }))

  return NextResponse.json({
    type: "pseudo-heatmap",
    cells,
    note: "Use PostGIS in production for spatial indexing and tile rendering.",
  })
}
