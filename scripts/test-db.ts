import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/lib/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Testing database connection...\n")

  await prisma.$queryRaw`SELECT 1`
  console.log("✓ Connected to Neon PostgreSQL\n")

  // ── System item types ──────────────────────────────────────────────
  const itemTypes = await prisma.itemType.findMany({ orderBy: { name: "asc" } })
  console.log(`✓ System item types (${itemTypes.length}):`)
  for (const t of itemTypes) {
    console.log(`  ${t.color}  ${t.name}`)
  }

  // ── Demo user ──────────────────────────────────────────────────────
  console.log()
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    include: {
      _count: { select: { items: true, collections: true } },
    },
  })

  if (!user) {
    console.error("✗ Demo user not found — run `npx prisma db seed`")
    process.exit(1)
  }

  console.log(`✓ Demo user: ${user.name} <${user.email}>`)
  console.log(`  isPro=${user.isPro}  items=${user._count.items}  collections=${user._count.collections}`)

  // ── Collections with items ─────────────────────────────────────────
  console.log()
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
  })

  console.log(`✓ Collections (${collections.length}):`)
  for (const col of collections) {
    console.log(`\n  📁 ${col.name}  (${col.items.length} items)`)
    if (col.description) console.log(`     ${col.description}`)
    for (const { item } of col.items) {
      const type = item.itemType.name.padEnd(8)
      const title = item.title.length > 60 ? item.title.slice(0, 57) + "..." : item.title
      console.log(`     [${type}]  ${title}`)
    }
  }

  // ── Table row counts ───────────────────────────────────────────────
  console.log()
  const [users, items, collectionCount, tags] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ])

  console.log("✓ Table row counts:")
  console.log(`  users:       ${users}`)
  console.log(`  items:       ${items}`)
  console.log(`  collections: ${collectionCount}`)
  console.log(`  tags:        ${tags}`)

  console.log("\nAll checks passed.")
}

main()
  .catch((e) => {
    console.error("Database test failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
