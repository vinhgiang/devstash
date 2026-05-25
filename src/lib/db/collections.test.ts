import { describe, it, expect, vi, beforeEach } from 'vitest'

const collectionCreate = vi.fn()
const collectionFindMany = vi.fn()
const collectionFindFirst = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      create: (...args: unknown[]) => collectionCreate(...args),
      findMany: (...args: unknown[]) => collectionFindMany(...args),
      findFirst: (...args: unknown[]) => collectionFindFirst(...args),
    },
  },
}))

import {
  createCollection,
  getAllCollections,
  getCollectionById,
  getCollectionOptions,
  getOwnedCollectionIds,
} from './collections'

describe('createCollection', () => {
  beforeEach(() => {
    collectionCreate.mockReset()
  })

  it('passes userId, name, and description through to Prisma', async () => {
    const date = new Date('2026-05-25T12:00:00Z')
    collectionCreate.mockResolvedValueOnce({
      id: 'col-1',
      name: 'React Patterns',
      description: 'reusable hooks',
      isFavorite: false,
      createdAt: date,
      updatedAt: date,
    })

    await createCollection('user-1', {
      name: 'React Patterns',
      description: 'reusable hooks',
    })

    expect(collectionCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'React Patterns',
        description: 'reusable hooks',
      },
    })
  })

  it('returns a CollectionRow with ISO date strings', async () => {
    const date = new Date('2026-05-25T12:00:00Z')
    collectionCreate.mockResolvedValueOnce({
      id: 'col-1',
      name: 'React Patterns',
      description: null,
      isFavorite: false,
      createdAt: date,
      updatedAt: date,
    })

    const result = await createCollection('user-1', {
      name: 'React Patterns',
      description: null,
    })

    expect(result).toEqual({
      id: 'col-1',
      name: 'React Patterns',
      description: null,
      isFavorite: false,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    })
  })

  it('persists a null description when none is provided', async () => {
    const date = new Date('2026-05-25T12:00:00Z')
    collectionCreate.mockResolvedValueOnce({
      id: 'col-2',
      name: 'No Desc',
      description: null,
      isFavorite: false,
      createdAt: date,
      updatedAt: date,
    })
    await createCollection('user-1', { name: 'No Desc', description: null })
    expect(collectionCreate.mock.calls[0][0].data.description).toBeNull()
  })
})

describe('getCollectionOptions', () => {
  beforeEach(() => {
    collectionFindMany.mockReset()
  })

  it('returns id+name rows scoped to the user, sorted by name', async () => {
    collectionFindMany.mockResolvedValueOnce([
      { id: 'c1', name: 'Alpha' },
      { id: 'c2', name: 'Bravo' },
    ])
    const result = await getCollectionOptions('user-1')
    expect(result).toEqual([
      { id: 'c1', name: 'Alpha' },
      { id: 'c2', name: 'Bravo' },
    ])
    const call = collectionFindMany.mock.calls[0][0]
    expect(call.where).toEqual({ userId: 'user-1' })
    expect(call.orderBy).toEqual({ name: 'asc' })
    expect(call.select).toEqual({ id: true, name: true })
  })
})

describe('getOwnedCollectionIds', () => {
  beforeEach(() => {
    collectionFindMany.mockReset()
  })

  it('returns [] without a query when ids is empty', async () => {
    const result = await getOwnedCollectionIds('user-1', [])
    expect(result).toEqual([])
    expect(collectionFindMany).not.toHaveBeenCalled()
  })

  it('queries the DB scoped to userId and id IN ids', async () => {
    collectionFindMany.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }])
    await getOwnedCollectionIds('user-1', ['c1', 'c2', 'c3-bogus'])
    const call = collectionFindMany.mock.calls[0][0]
    expect(call.where).toEqual({ userId: 'user-1', id: { in: ['c1', 'c2', 'c3-bogus'] } })
  })

  it('returns only the ids that the user owns', async () => {
    collectionFindMany.mockResolvedValueOnce([{ id: 'c1' }])
    const result = await getOwnedCollectionIds('user-1', ['c1', 'bogus'])
    expect(result).toEqual(['c1'])
  })
})

describe('getAllCollections', () => {
  beforeEach(() => {
    collectionFindMany.mockReset()
  })

  it('queries all of the user collections without a take limit', async () => {
    collectionFindMany.mockResolvedValueOnce([])
    await getAllCollections('user-1')
    const call = collectionFindMany.mock.calls[0][0]
    expect(call.where).toEqual({ userId: 'user-1' })
    expect(call.orderBy).toEqual({ updatedAt: 'desc' })
    expect(call.take).toBeUndefined()
  })

  it('maps rows with itemCount, borderColor, and typeIcons', async () => {
    collectionFindMany.mockResolvedValueOnce([
      {
        id: 'c1',
        name: 'React Patterns',
        description: 'desc',
        isFavorite: true,
        _count: { items: 3 },
        items: [
          { item: { itemType: { id: 't1', icon: 'Code', color: '#3b82f6' } } },
          { item: { itemType: { id: 't1', icon: 'Code', color: '#3b82f6' } } },
          { item: { itemType: { id: 't2', icon: 'StickyNote', color: '#fde047' } } },
        ],
      },
    ])
    const result = await getAllCollections('user-1')
    expect(result).toEqual([
      {
        id: 'c1',
        name: 'React Patterns',
        description: 'desc',
        isFavorite: true,
        itemCount: 3,
        borderColor: '#3b82f6',
        typeIcons: [
          { icon: 'Code', color: '#3b82f6' },
          { icon: 'StickyNote', color: '#fde047' },
        ],
      },
    ])
  })
})

describe('getCollectionById', () => {
  beforeEach(() => {
    collectionFindFirst.mockReset()
  })

  it('returns null when the collection is not owned by the user', async () => {
    collectionFindFirst.mockResolvedValueOnce(null)
    const result = await getCollectionById('user-1', 'missing')
    expect(result).toBeNull()
  })

  it('scopes the query by id and userId and includes the item count', async () => {
    collectionFindFirst.mockResolvedValueOnce(null)
    await getCollectionById('user-1', 'col-1')
    const call = collectionFindFirst.mock.calls[0][0]
    expect(call.where).toEqual({ id: 'col-1', userId: 'user-1' })
    expect(call.include).toEqual({ _count: { select: { items: true } } })
  })

  it('maps Prisma row into CollectionDetail with ISO dates and itemCount', async () => {
    const createdAt = new Date('2026-05-01T10:00:00Z')
    const updatedAt = new Date('2026-05-02T11:00:00Z')
    collectionFindFirst.mockResolvedValueOnce({
      id: 'col-1',
      name: 'React Patterns',
      description: 'desc',
      isFavorite: true,
      createdAt,
      updatedAt,
      _count: { items: 5 },
    })
    const result = await getCollectionById('user-1', 'col-1')
    expect(result).toEqual({
      id: 'col-1',
      name: 'React Patterns',
      description: 'desc',
      isFavorite: true,
      itemCount: 5,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
  })
})
