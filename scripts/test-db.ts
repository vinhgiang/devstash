import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/lib/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Testing database connection...\n")

  // Verify connection
  await prisma.$queryRaw`SELECT 1`
  console.log("✓ Connected to Neon PostgreSQL\n")

  // Check system item types
  const itemTypes = await prisma.itemType.findMany({
    orderBy: { name: "asc" },
  })

  console.log(`✓ Found ${itemTypes.length} system item types:`)
  for (const t of itemTypes) {
    console.log(`  - ${t.name} (${t.color}) isSystem=${t.isSystem}`)
  }

  // Check table counts
  const [users, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ])

  console.log("\n✓ Table row counts:")
  console.log(`  users:       ${users}`)
  console.log(`  items:       ${items}`)
  console.log(`  collections: ${collections}`)
  console.log(`  tags:        ${tags}`)

  console.log("\nAll checks passed.")
}

main()
  .catch((e) => {
    console.error("Database test failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
