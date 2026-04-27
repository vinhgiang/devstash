import 'server-only'
import { prisma } from '@/lib/prisma'

export interface CollectionWithMeta {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  borderColor: string | null
  typeIcons: { icon: string; color: string }[]
}

export interface CollectionStats {
  total: number
  favorites: number
}

export async function getRecentCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  })

  return collections.map((col) => {
    const typeCounts = new Map<string, { count: number; icon: string; color: string }>()
    for (const ic of col.items) {
      const type = ic.item.itemType
      const existing = typeCounts.get(type.id)
      if (existing) {
        existing.count++
      } else {
        typeCounts.set(type.id, { count: 1, icon: type.icon, color: type.color })
      }
    }

    const sortedTypes = [...typeCounts.values()].sort((a, b) => b.count - a.count)

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      borderColor: sortedTypes[0]?.color ?? null,
      typeIcons: sortedTypes.map(({ icon, color }) => ({ icon, color })),
    }
  })
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ])
  return { total, favorites }
}

export interface SidebarCollection {
  id: string
  name: string
  isFavorite: boolean
  dotColor: string | null
}

export async function getSidebarCollections(userId: string): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
  })

  return collections.map((col) => {
    const typeCounts = new Map<string, { count: number; color: string }>()
    for (const ic of col.items) {
      const type = ic.item.itemType
      const existing = typeCounts.get(type.id)
      if (existing) {
        existing.count++
      } else {
        typeCounts.set(type.id, { count: 1, color: type.color })
      }
    }
    const sorted = [...typeCounts.values()].sort((a, b) => b.count - a.count)
    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      dotColor: sorted[0]?.color ?? null,
    }
  })
}
