import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/lib/generated/prisma/client"

const KEEP_EMAIL = "demo@devstash.io"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const confirmed = process.argv.includes("--yes")

  const demo = await prisma.user.findUnique({ where: { email: KEEP_EMAIL } })
  if (!demo) {
    console.error(`✗ Demo user (${KEEP_EMAIL}) not found. Aborting.`)
    process.exit(1)
  }

  const targets = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  })

  if (targets.length === 0) {
    console.log("No users to delete. Only the demo user exists.")
    return
  }

  console.log(`Demo user kept: ${demo.email} (${demo.id})`)
  console.log(`Users to delete (${targets.length}):`)
  for (const u of targets) {
    console.log(`  - ${u.email}${u.name ? ` (${u.name})` : ""}`)
  }

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.")
    return
  }

  const targetEmails = targets.map((u) => u.email)

  console.log("\nDeleting...")

  // Verification tokens are keyed by email (identifier), not userId — no cascade.
  const tokenResult = await prisma.verificationToken.deleteMany({
    where: { identifier: { in: targetEmails } },
  })

  // Cascades: items, collections, item_collections, accounts, sessions,
  // and custom item_types (system types have userId = null and are untouched).
  const userResult = await prisma.user.deleteMany({
    where: { email: { in: targetEmails } },
  })

  console.log(`✓ Deleted ${userResult.count} user(s)`)
  console.log(`✓ Deleted ${tokenResult.count} verification token(s)`)
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
