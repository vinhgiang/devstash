import { describe, it, expect, vi, beforeEach } from 'vitest'

const collectionCreate = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      create: (...args: unknown[]) => collectionCreate(...args),
    },
  },
}))

import { createCollection } from './collections'

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
