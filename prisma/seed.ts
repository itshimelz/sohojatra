import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Check if any superadmin exists
  const existingSuperadmin = await prisma.user.findFirst({
    where: { role: "superadmin" },
  })

  if (existingSuperadmin) {
    console.log(
      `Superadmin already exists: ${existingSuperadmin.email} (${existingSuperadmin.id})`
    )
    return
  }

  // Promote the first user in the database to superadmin, if any exist.
  // In production, replace this with a specific user ID or email.
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  })

  if (!firstUser) {
    console.log(
      "No users found. Sign up first, then re-run: npx prisma db seed"
    )
    return
  }

  await prisma.user.update({
    where: { id: firstUser.id },
    data: { role: "superadmin" },
  })

  console.log(`Promoted "${firstUser.name}" (${firstUser.email}) to superadmin`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
