import { NextResponse } from "next/server"
import { ConcernCategory, ConcernStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"

const MAX_FEATURES = 8_000

const concernCategories = new Set<string>(Object.values(ConcernCategory))
const concernStatuses = new Set<string>(Object.values(ConcernStatus))

function parseBBox(searchParams: URLSearchParams): { west: number; south: number; east: number; north: number } | null {
  const west = Number.parseFloat(searchParams.get("west") ?? "")
  const south = Number.parseFloat(searchParams.get("south") ?? "")
  const east = Number.parseFloat(searchParams.get("east") ?? "")
  const north = Number.parseFloat(searchParams.get("north") ?? "")

  if (![west, south, east, north].every((n) => Number.isFinite(n))) return null
  if (south < -90 || north > 90 || south >= north) return null
  if (west < -180 || east > 180 || west >= east) return null

  return { west, south, east, north }
}

/**
 * Public heatmap feed: points inside the viewport bbox only (no titles or PII).
 * GET /api/concerns/heatmap?west=&south=&east=&north=&limit=&category=&status=
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bbox = parseBBox(searchParams)
  if (!bbox) {
    return NextResponse.json(
      { error: "INVALID_BBOX", message: "Provide valid west, south, east, north query parameters." },
      { status: 400 }
    )
  }

  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10)
  const take = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_FEATURES)
    : 5_000

  const categoryParam = searchParams.get("category")
  const category =
    categoryParam && concernCategories.has(categoryParam) ? (categoryParam as ConcernCategory) : undefined

  const statusParam = searchParams.get("status")
  const status =
    statusParam && concernStatuses.has(statusParam) ? (statusParam as ConcernStatus) : undefined

  const rows = await prisma.concern.findMany({
    where: {
      locationLat: { gte: bbox.south, lte: bbox.north },
      locationLng: { gte: bbox.west, lte: bbox.east },
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    },
    select: {
      id: true,
      locationLat: true,
      locationLng: true,
      upvotes: true,
    },
    take,
  })

  const collection = {
    type: "FeatureCollection",
    features: rows.map((r) => {
      const w = Math.min(8, 1 + Math.log1p(Math.max(0, r.upvotes)))
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [r.locationLng, r.locationLat],
        },
        properties: {
          id: r.id,
          weight: w,
        },
      }
    }),
  }

  return NextResponse.json(collection, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  })
}
