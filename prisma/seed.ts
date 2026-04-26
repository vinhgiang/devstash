import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/lib/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ============================================
// SYSTEM ITEM TYPES
// ============================================
const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { name: "link", icon: "Link", color: "#10b981", isSystem: true },
]

async function main() {
  console.log("Seeding system item types...")
  // skipDuplicates doesn't work for nullable unique columns (Postgres NULL != NULL),
  // so we use findFirst + create per type instead.
  for (const type of systemItemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    })
    if (!existing) {
      await prisma.itemType.create({ data: type })
    }
  }

  // Build map from the canonical (first) system type per name
  const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } })
  const typeMap: Record<string, string> = {}
  for (const t of allTypes) {
    if (!typeMap[t.name]) typeMap[t.name] = t.id
  }

  // ============================================
  // DEMO USER
  // ============================================
  console.log("Seeding demo user...")
  const passwordHash = await bcrypt.hash("12345678", 12)
  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  })

  // ============================================
  // COLLECTIONS & ITEMS
  // ============================================
  console.log("Seeding collections and items...")

  // ---------- React Patterns ----------
  const reactPatterns = await prisma.collection.upsert({
    where: { id: "seed-col-react-patterns" },
    update: {},
    create: {
      id: "seed-col-react-patterns",
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId: user.id,
    },
  })

  const reactItems = await Promise.all([
    prisma.item.upsert({
      where: { id: "seed-item-use-debounce" },
      update: {},
      create: {
        id: "seed-item-use-debounce",
        title: "Custom Hooks (useDebounce, useLocalStorage)",
        contentType: "TEXT",
        language: "typescript",
        userId: user.id,
        itemTypeId: typeMap.snippet,
        content: `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T) => {
    setStored(value)
    window.localStorage.setItem(key, JSON.stringify(value))
  }

  return [stored, setValue] as const
}`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-context-pattern" },
      update: {},
      create: {
        id: "seed-item-context-pattern",
        title: "Context Provider + Compound Component Pattern",
        contentType: "TEXT",
        language: "typescript",
        userId: user.id,
        itemTypeId: typeMap.snippet,
        content: `import { createContext, useContext, useState, ReactNode } from 'react'
interface TabsContextValue {
  active: string
  setActive: (id: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('useTabs must be used within <Tabs>')
  return ctx
}

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab)
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>
}

Tabs.Tab = function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { active, setActive } = useTabs()
  return (
    <button
      onClick={() => setActive(id)}
      data-active={active === id}
      className="px-4 py-2 data-[active=true]:border-b-2 data-[active=true]:border-blue-500"
    >
      {children}
    </button>
  )
}

Tabs.Panel = function Panel({ id, children }: { id: string; children: ReactNode }) {
  const { active } = useTabs()
  return active === id ? <div>{children}</div> : null
}`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-utility-fns" },
      update: {},
      create: {
        id: "seed-item-utility-fns",
        title: "Utility Functions (cn, formatDate, truncate)",
        contentType: "TEXT",
        language: "typescript",
        userId: user.id,
        itemTypeId: typeMap.snippet,
        content: `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}`,
      },
    }),
  ])

  await prisma.itemCollection.createMany({
    data: reactItems.map((item) => ({
      itemId: item.id,
      collectionId: reactPatterns.id,
    })),
    skipDuplicates: true,
  })

  // ---------- AI Workflows ----------
  const aiWorkflows = await prisma.collection.upsert({
    where: { id: "seed-col-ai-workflows" },
    update: {},
    create: {
      id: "seed-col-ai-workflows",
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId: user.id,
    },
  })

  const aiItems = await Promise.all([
    prisma.item.upsert({
      where: { id: "seed-item-code-review-prompt" },
      update: {},
      create: {
        id: "seed-item-code-review-prompt",
        title: "Code Review Prompt",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.prompt,
        content: `You are an experienced senior software engineer conducting a thorough code review.

Review the following code and provide feedback on:
1. **Correctness** – Are there any bugs, edge cases, or logic errors?
2. **Performance** – Are there any unnecessary re-renders, N+1 queries, or inefficient algorithms?
3. **Security** – Are there any XSS, injection, or auth vulnerabilities?
4. **Readability** – Is the code clear, well-named, and easy to follow?
5. **Best Practices** – Does it follow the conventions of the language/framework?

Format your response as:
- A summary paragraph
- A bulleted list of issues (label each: 🔴 Critical / 🟡 Minor / 🟢 Suggestion)
- A revised version of the code if changes are needed

Code to review:
\`\`\`
[PASTE CODE HERE]
\`\`\``,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-doc-gen-prompt" },
      update: {},
      create: {
        id: "seed-item-doc-gen-prompt",
        title: "Documentation Generation Prompt",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.prompt,
        content: `Generate comprehensive documentation for the following code.

Include:
- **Overview**: What this code does and why it exists
- **Parameters / Props**: Name, type, required/optional, description
- **Return value**: Type and description
- **Usage examples**: At least 2 realistic examples
- **Edge cases**: Known limitations or gotchas

Keep the tone concise and developer-friendly. Use markdown formatting.

Code:
\`\`\`
[PASTE CODE HERE]
\`\`\``,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-refactor-prompt" },
      update: {},
      create: {
        id: "seed-item-refactor-prompt",
        title: "Refactoring Assistance Prompt",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.prompt,
        content: `You are a refactoring expert. Analyze the code below and suggest targeted improvements.

Goals:
- Reduce complexity and improve readability
- Extract reusable abstractions where it reduces duplication
- Apply SOLID principles where appropriate
- Do NOT change observable behavior

Respond with:
1. A brief assessment of the current code's issues
2. The refactored code with inline comments explaining key changes
3. A short list of what changed and why

Code to refactor:
\`\`\`
[PASTE CODE HERE]
\`\`\``,
      },
    }),
  ])

  await prisma.itemCollection.createMany({
    data: aiItems.map((item) => ({ itemId: item.id, collectionId: aiWorkflows.id })),
    skipDuplicates: true,
  })

  // ---------- DevOps ----------
  const devops = await prisma.collection.upsert({
    where: { id: "seed-col-devops" },
    update: {},
    create: {
      id: "seed-col-devops",
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      userId: user.id,
    },
  })

  const devopsItems = await Promise.all([
    prisma.item.upsert({
      where: { id: "seed-item-dockerfile" },
      update: {},
      create: {
        id: "seed-item-dockerfile",
        title: "Next.js Dockerfile (multi-stage)",
        contentType: "TEXT",
        language: "dockerfile",
        userId: user.id,
        itemTypeId: typeMap.snippet,
        content: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-deploy-cmd" },
      update: {},
      create: {
        id: "seed-item-deploy-cmd",
        title: "Deploy to production",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.command,
        content: `npm run build && npx prisma migrate deploy && docker build -t app:latest . && docker push registry/app:latest`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-gh-actions-link" },
      update: {},
      create: {
        id: "seed-item-gh-actions-link",
        title: "GitHub Actions Documentation",
        contentType: "URL",
        url: "https://docs.github.com/en/actions",
        userId: user.id,
        itemTypeId: typeMap.link,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-docker-docs-link" },
      update: {},
      create: {
        id: "seed-item-docker-docs-link",
        title: "Docker Official Documentation",
        contentType: "URL",
        url: "https://docs.docker.com",
        userId: user.id,
        itemTypeId: typeMap.link,
      },
    }),
  ])

  await prisma.itemCollection.createMany({
    data: devopsItems.map((item) => ({ itemId: item.id, collectionId: devops.id })),
    skipDuplicates: true,
  })

  // ---------- Terminal Commands ----------
  const terminalCmds = await prisma.collection.upsert({
    where: { id: "seed-col-terminal-commands" },
    update: {},
    create: {
      id: "seed-col-terminal-commands",
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId: user.id,
    },
  })

  const terminalItems = await Promise.all([
    prisma.item.upsert({
      where: { id: "seed-item-git-commands" },
      update: {},
      create: {
        id: "seed-item-git-commands",
        title: "Git – undo last commit, clean branches",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.command,
        content: `# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Delete all local branches already merged into main
git branch --merged main | grep -v 'main' | xargs git branch -d

# Interactive rebase last N commits
git rebase -i HEAD~5

# Find which commit introduced a bug
git bisect start && git bisect bad && git bisect good <hash>`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-docker-commands" },
      update: {},
      create: {
        id: "seed-item-docker-commands",
        title: "Docker – prune, exec, logs",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.command,
        content: `# Remove all stopped containers, unused images, networks, build cache
docker system prune -af

# Open a shell inside a running container
docker exec -it <container_name> sh

# Tail logs from a container
docker logs -f --tail 100 <container_name>

# List all containers with size
docker ps -as`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-process-commands" },
      update: {},
      create: {
        id: "seed-item-process-commands",
        title: "Process management – kill port, find PID",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.command,
        content: `# Kill process running on a specific port (macOS/Linux)
lsof -ti:<port> | xargs kill -9

# Find PID by name
pgrep -fl node

# Show top memory-consuming processes
ps aux --sort=-%mem | head -10

# Background a process and disown it
nohup <command> &>/dev/null & disown`,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-npm-commands" },
      update: {},
      create: {
        id: "seed-item-npm-commands",
        title: "npm / pnpm – audit, dedupe, outdated",
        contentType: "TEXT",
        userId: user.id,
        itemTypeId: typeMap.command,
        content: `# Check for outdated packages
npm outdated

# Fix vulnerabilities automatically
npm audit fix

# Remove duplicate packages
npm dedupe

# List installed packages (top-level only)
npm ls --depth=0

# Why is a package installed?
npm why <package>`,
      },
    }),
  ])

  await prisma.itemCollection.createMany({
    data: terminalItems.map((item) => ({
      itemId: item.id,
      collectionId: terminalCmds.id,
    })),
    skipDuplicates: true,
  })

  // ---------- Design Resources ----------
  const designResources = await prisma.collection.upsert({
    where: { id: "seed-col-design-resources" },
    update: {},
    create: {
      id: "seed-col-design-resources",
      name: "Design Resources",
      description: "UI/UX resources and references",
      userId: user.id,
    },
  })

  const designItems = await Promise.all([
    prisma.item.upsert({
      where: { id: "seed-item-tailwind-link" },
      update: {},
      create: {
        id: "seed-item-tailwind-link",
        title: "Tailwind CSS Documentation",
        contentType: "URL",
        url: "https://tailwindcss.com/docs",
        userId: user.id,
        itemTypeId: typeMap.link,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-shadcn-link" },
      update: {},
      create: {
        id: "seed-item-shadcn-link",
        title: "shadcn/ui Component Library",
        contentType: "URL",
        url: "https://ui.shadcn.com",
        userId: user.id,
        itemTypeId: typeMap.link,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-radix-link" },
      update: {},
      create: {
        id: "seed-item-radix-link",
        title: "Radix UI Design System",
        contentType: "URL",
        url: "https://www.radix-ui.com",
        userId: user.id,
        itemTypeId: typeMap.link,
      },
    }),
    prisma.item.upsert({
      where: { id: "seed-item-lucide-link" },
      update: {},
      create: {
        id: "seed-item-lucide-link",
        title: "Lucide Icon Library",
        contentType: "URL",
        url: "https://lucide.dev/icons",
        userId: user.id,
        itemTypeId: typeMap.link,
      },
    }),
  ])

  await prisma.itemCollection.createMany({
    data: designItems.map((item) => ({
      itemId: item.id,
      collectionId: designResources.id,
    })),
    skipDuplicates: true,
  })

  console.log("Seeding complete!")
  console.log(`  ${systemItemTypes.length} system item types`)
  console.log(`  1 demo user (demo@devstash.io)`)
  console.log(`  5 collections`)
  console.log(
    `  ${reactItems.length + aiItems.length + devopsItems.length + terminalItems.length + designItems.length} items`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
