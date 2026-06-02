import 'server-only'
import { prisma } from '@/lib/prisma'

export interface SearchItem {
  id: string
  title: string
  preview: string
  type: {
    name: string
    icon: string
    color: string
  }
}

export interface SearchCollection {
  id: string
  name: string
  itemCount: number
}

export interface SearchData {
  items: SearchItem[]
  collections: SearchCollection[]
}

const PREVIEW_LENGTH = 120

function buildPreview(item: {
  description: string | null
  content: string | null
  url: string | null
  fileName: string | null
}): string {
  const raw = item.description ?? item.content ?? item.url ?? item.fileName ?? ''
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= PREVIEW_LENGTH) return collapsed
  return collapsed.slice(0, PREVIEW_LENGTH).trimEnd() + '…'
}

export async function getSearchableData(userId: string): Promise<SearchData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        url: true,
        fileName: true,
        itemType: { select: { name: true, icon: true, color: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.collection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      preview: buildPreview(item),
      type: {
        name: item.itemType.name,
        icon: item.itemType.icon,
        color: item.itemType.color,
      },
    })),
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      itemCount: c._count.items,
    })),
  }
}
