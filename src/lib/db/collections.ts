import 'server-only'
import {prisma} from '@/lib/prisma'

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

const TYPE_SAMPLE_LIMIT = 50

type TypeSampleItem = { item: { itemType: { id: string; icon: string; color: string } } }

function deriveTypeAccents(items: TypeSampleItem[]) {
  const typeCounts = new Map<string, { count: number; icon: string; color: string }>()
  for (const ic of items) {
    const t = ic.item.itemType
    const existing = typeCounts.get(t.id)
    if (existing) {
      existing.count++
    } else {
      typeCounts.set(t.id, { count: 1, icon: t.icon, color: t.color })
    }
  }
  return [...typeCounts.values()].sort((a, b) => b.count - a.count)
}

async function fetchCollectionsWithMeta(
  userId: string,
  take?: number,
): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    ...(take !== undefined ? { take } : {}),
    include: {
      _count: { select: { items: true } },
      items: {
        take: TYPE_SAMPLE_LIMIT,
        include: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true } },
            },
          },
        },
      },
    },
  })

  return collections.map((col) => {
    const sortedTypes = deriveTypeAccents(col.items)
    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      borderColor: sortedTypes[0]?.color ?? null,
      typeIcons: sortedTypes.map(({ icon, color }) => ({ icon, color })),
    }
  })
}

export async function getRecentCollections(userId: string): Promise<CollectionWithMeta[]> {
  return fetchCollectionsWithMeta(userId, 6)
}

export async function getAllCollections(userId: string): Promise<CollectionWithMeta[]> {
  return fetchCollectionsWithMeta(userId)
}

export interface CollectionDetail {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  createdAt: string
  updatedAt: string
}

export async function getCollectionById(
  userId: string,
  collectionId: string,
): Promise<CollectionDetail | null> {
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: { _count: { select: { items: true } } },
  })
  if (!col) return null
  return {
    id: col.id,
    name: col.name,
    description: col.description,
    isFavorite: col.isFavorite,
    itemCount: col._count.items,
    createdAt: col.createdAt.toISOString(),
    updatedAt: col.updatedAt.toISOString(),
  }
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

export interface CreateCollectionInput {
  name: string
  description: string | null
}

export interface CollectionRow {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export async function createCollection(
  userId: string,
  data: CreateCollectionInput,
): Promise<CollectionRow> {
  const created = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
    },
  })
  return {
    id: created.id,
    name: created.name,
    description: created.description,
    isFavorite: created.isFavorite,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  }
}

export interface CollectionOption {
  id: string
  name: string
}

export async function getCollectionOptions(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: {userId},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  });
}

export async function getOwnedCollectionIds(
  userId: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return []
  const rows = await prisma.collection.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

export async function getSidebarCollections(userId: string): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: {
        take: TYPE_SAMPLE_LIMIT,
        include: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true } },
            },
          },
        },
      },
    },
  })

  return collections.map((col) => {
    const sorted = deriveTypeAccents(col.items)
    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      dotColor: sorted[0]?.color ?? null,
    }
  })
}
