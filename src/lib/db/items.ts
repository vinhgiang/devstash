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
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.item.groupBy({
      by: ['itemTypeId'],
      where: { userId },
      _count: { id: true },
    }),
  ])
  const countMap = new Map(counts.map((c) => [c.itemTypeId, c._count.id]))
  return types
    .map((t) => ({ ...t, count: countMap.get(t.id) ?? 0 }))
    .sort((a, b) => TYPE_ORDER.indexOf(a.name) - TYPE_ORDER.indexOf(b.name))
}

export async function getPinnedItems(userId: string, limit = 20): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: { itemType: true, tags: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
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

export interface ProfileUser {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: Date
  hasPassword: boolean
}

export async function getProfileUser(userId: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, image: true, createdAt: true, password: true },
  })
  if (!user) return null
  const { password, ...rest } = user
  return { ...rest, hasPassword: password !== null }
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: { itemType: true, tags: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
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