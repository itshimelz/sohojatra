import { writeFileSync } from "node:fs"
import { join } from "node:path"

const stateFilePath = join(process.cwd(), ".nagarik-state.json")

const now = new Date().toISOString()

const state = {
  concerns: [
    {
      id: "c-001",
      title: "Open manhole on Mirpur 10 roundabout",
      description:
        "There is a completely open manhole near the metro rail station entrance. It is extremely dangerous for pedestrians, especially at night when the streetlights are dim.",
      status: "Under Review",
      upvotes: 142,
      downvotes: 8,
      hasUpvoted: true,
      createdAt: now,
      author: { name: "Ahmed R." },
      location: { lat: 23.8069, lng: 90.3687, address: "Mirpur 10, Dhaka" },
      photos: ["https://placehold.co/600x400/png?text=Open+Manhole"],
      updates: [],
    },
  ],
  proposals: [
    {
      id: "p-101",
      title: "Create ward-level drainage status board",
      body:
        "Every ward should publish a live drainage map with blocked lines, cleaning status, and the next maintenance date.",
      author: "Dr. Rafiq Hasan",
      category: "Infrastructure",
      votes: 421,
      downvotes: 12,
      createdAt: now,
      comments: [],
    },
  ],
  researchProblems: [
    {
      id: "rp-11",
      title: "Flood-prone intersection prediction in Dhaka South",
      ministry: "Ministry of Local Government",
      grant: "BDT 12,00,000",
      deadline: "15 May 2026",
      summary:
        "Build a model that predicts flood-prone intersections using rainfall, drainage status, and past complaint density.",
    },
  ],
  moderation: [
    {
      id: "mq-1",
      title: "Proposal: anti-dumping zone near school",
      reason: "Needs source citations and contractor references",
      severity: "Medium",
      status: "Pending",
    },
  ],
}

// Write file-backed state for local fallback
writeFileSync(stateFilePath, JSON.stringify(state, null, 2), "utf8")
console.log(`Seeded local civic state at ${stateFilePath}`)

// Attempt to seed the database if Prisma is available
try {
  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()

  console.log("Attempting to seed database via Prisma...")

  // Check if database is reachable
  await prisma.$queryRaw`SELECT 1`

  // Seed concerns into the database
  for (const concern of state.concerns) {
    await prisma.concern.upsert({
      where: { id: concern.id },
      update: {},
      create: {
        id: concern.id,
        title: concern.title,
        description: concern.description,
        status: "SUBMITTED",
        location: concern.location.address,
        latitude: concern.location.lat,
        longitude: concern.location.lng,
        upvotes: concern.upvotes,
        downvotes: concern.downvotes,
      },
    })
  }

  console.log("✓ Database seeding complete.")
  await prisma.$disconnect()
} catch (err) {
  console.log(
    "ℹ Database not available (expected during dev setup). Using file-backed state."
  )
}
