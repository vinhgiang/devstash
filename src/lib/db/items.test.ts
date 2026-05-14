import { describe, it, expect, vi, beforeEach } from 'vitest'

const findFirst = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: { findFirst: (...args: unknown[]) => findFirst(...args) },
  },
}))

import { getItemDetail } from './items'

describe('getItemDetail', () => {
  beforeEach(() => {
    findFirst.mockReset()
  })

  it('returns null when the item is not found', async () => {
    findFirst.mockResolvedValueOnce(null)
    expect(await getItemDetail('user-1', 'missing')).toBeNull()
  })

  it('scopes the query by userId and id', async () => {
    findFirst.mockResolvedValueOnce(null)
    await getItemDetail('user-1', 'item-1')
    const call = findFirst.mock.calls[0][0]
    expect(call.where).toEqual({ id: 'item-1', userId: 'user-1' })
  })

  it('maps the Prisma row into the API shape', async () => {
    const createdAt = new Date('2026-05-01T10:00:00Z')
    const updatedAt = new Date('2026-05-02T11:00:00Z')
    findFirst.mockResolvedValueOnce({
      id: 'item-1',
      title: 'useAuth Hook',
      description: 'desc',
      contentType: 'TEXT',
      content: 'const x = 1',
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: 'typescript',
      isPinned: true,
      isFavorite: false,
      createdAt,
      updatedAt,
      tags: [{ name: 'react' }, { name: 'hooks' }],
      collections: [
        { collection: { id: 'col-1', name: 'React Patterns' } },
      ],
      itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
    })

    const result = await getItemDetail('user-1', 'item-1')
    expect(result).toEqual({
      id: 'item-1',
      title: 'useAuth Hook',
      description: 'desc',
      contentType: 'TEXT',
      content: 'const x = 1',
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: 'typescript',
      isPinned: true,
      isFavorite: false,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      tags: ['react', 'hooks'],
      collections: [{ id: 'col-1', name: 'React Patterns' }],
      type: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
    })
  })
})
