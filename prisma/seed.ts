import { Pool } from "pg"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const BADGE_CATALOG = [
  { key: "first-concern",       label: "First Concern",       description: "Submitted your first civic concern" },
  { key: "problem-solver",      label: "Problem Solver",      description: "Had a concern reach Resolved status" },
  { key: "top-voice",           label: "Top Voice",           description: "Received 100+ upvotes on proposals or comments" },
  { key: "verified-expert",     label: "Verified Expert",     description: "Verified as an expert or professor" },
  { key: "100-day-contributor", label: "100-Day Contributor", description: "Active for 100+ days on the platform" },
  { key: "research-pioneer",    label: "Research Pioneer",    description: "Completed a research milestone" },
  { key: "assembly-regular",    label: "Assembly Regular",    description: "RSVPed to 5+ assembly events" },
  { key: "rights-champion",     label: "Rights Champion",     description: "Submitted 10+ concerns in the Rights category" },
  { key: "mob-buster",          label: "Mob Buster",          description: "Helped identify coordinated inauthentic behavior" },
]

async function seedBadges() {
  console.log("Seeding badge catalog...")
  for (const badge of BADGE_CATALOG) {
    await prisma.badge.upsert({
      where: { name: badge.key },
      update: { description: badge.description, criteria: badge.label, iconKey: badge.key },
      create: {
        id: `badge-${badge.key}`,
        name: badge.key,
        description: badge.description,
        criteria: badge.label,
        iconKey: badge.key,
      },
    })
    console.log(`  ✓ ${badge.label}`)
  }
  console.log(`Seeded ${BADGE_CATALOG.length} badges.\n`)
}

async function seedSuperadmin() {
  const existingSuperadmin = await prisma.user.findFirst({
    where: { role: "superadmin" },
  })

  if (existingSuperadmin) {
    console.log(`Superadmin already exists: ${existingSuperadmin.email} (${existingSuperadmin.id})`)
    return
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  })

  if (!firstUser) {
    console.log("No users found. Sign up first, then re-run: npx prisma db seed")
    return
  }

  await prisma.user.update({
    where: { id: firstUser.id },
    data: { role: "superadmin" },
  })

  console.log(`Promoted "${firstUser.name}" (${firstUser.email}) to superadmin`)
}

async function main() {
  await seedBadges()
  await seedSuperadmin()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
