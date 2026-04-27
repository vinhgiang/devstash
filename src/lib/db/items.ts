import 'server-only'
import { prisma } from '@/lib/prisma'

export interface ItemStats {
  total: number
  favorites: number
}

export interface ItemTypeWithCount {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

export interface ItemWithType {
  id: string
  title: string
  description?: string
  tags: string[]
  createdAt: string
  type: {
    name: string
    icon: string
    color: string
  }
}

const TYPE_ORDER = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link']

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ])
  return { total, favorites }
}

export async function getSystemItemTypesWithCounts(userId: string): Promise<ItemTypeWithCount[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({ where: { isSystem: true } }),
    prisma.item.groupBy({
      by: ['itemTypeId'],
      where: { userId },
      _count: { id: true },
    }),
  ])
  const countMap = new Map(counts.map((c) => [c.itemTypeId, c._count.id]))
  return types
    .map((t) => ({ id: t.id, name: t.name, icon: t.icon, color: t.color, count: countMap.get(t.id) ?? 0 }))
    .sort((a, b) => TYPE_ORDER.indexOf(a.name) - TYPE_ORDER.indexOf(b.name))
}

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: { itemType: true, tags: true },
    orderBy: { updatedAt: 'desc' },
  })
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    tags: item.tags.map((t) => t.name),
    createdAt: item.createdAt.toISOString(),
    type: { name: item.itemType.name, icon: item.itemType.icon, color: item.itemType.color },
  }))
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: { itemType: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    tags: [],
    createdAt: item.createdAt.toISOString(),
    type: { name: item.itemType.name, icon: item.itemType.icon, color: item.itemType.color },
  }))
}