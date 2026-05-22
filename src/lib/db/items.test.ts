import { describe, it, expect, vi, beforeEach } from 'vitest'

const findFirst = vi.fn()
const itemUpdate = vi.fn()
const itemCreate = vi.fn()
const itemDelete = vi.fn()
const tagUpsert = vi.fn()
const transaction = vi.fn(
  async (
    fn: (tx: {
      tag: { upsert: typeof tagUpsert }
      item: { update: typeof itemUpdate; create: typeof itemCreate }
    }) => Promise<unknown>,
  ) =>
    fn({
      tag: { upsert: tagUpsert },
      item: { update: itemUpdate, create: itemCreate },
    }),
)

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      delete: (...args: unknown[]) => itemDelete(...args),
    },
    $transaction: (fn: Parameters<typeof transaction>[0]) => transaction(fn),
  },
}))

import { createItem, deleteItem, getItemDetail, updateItem } from './items'

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

describe('updateItem', () => {
  const baseInput = {
    title: 'New title',
    description: 'New desc',
    content: 'new content',
    url: null,
    language: 'typescript',
    tags: ['react', 'hooks'],
  }

  function stubDetail() {
    const date = new Date('2026-05-10T00:00:00Z')
    findFirst.mockResolvedValueOnce({
      id: 'item-1',
      title: 'New title',
      description: 'New desc',
      contentType: 'TEXT',
      content: 'new content',
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: 'typescript',
      isPinned: false,
      isFavorite: false,
      createdAt: date,
      updatedAt: date,
      tags: [{ name: 'react' }, { name: 'hooks' }],
      collections: [],
      itemType: { id: 't1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
    })
  }

  beforeEach(() => {
    findFirst.mockReset()
    itemUpdate.mockReset()
    tagUpsert.mockReset()
    transaction.mockClear()
  })

  it('returns null when item is not found (no transaction run)', async () => {
    findFirst.mockResolvedValueOnce(null)
    const result = await updateItem('user-1', 'missing', baseInput)
    expect(result).toBeNull()
    expect(transaction).not.toHaveBeenCalled()
  })

  it('upserts each tag, then disconnects existing tags and connects by name', async () => {
    findFirst.mockResolvedValueOnce({ id: 'item-1' })
    stubDetail()
    await updateItem('user-1', 'item-1', baseInput)

    expect(tagUpsert).toHaveBeenCalledTimes(2)
    expect(tagUpsert.mock.calls[0][0]).toEqual({
      where: { name: 'react' },
      update: {},
      create: { name: 'react' },
    })

    const updateArgs = itemUpdate.mock.calls[0][0]
    expect(updateArgs.where).toEqual({ id: 'item-1' })
    expect(updateArgs.data.title).toBe('New title')
    expect(updateArgs.data.tags).toEqual({
      set: [],
      connect: [{ name: 'react' }, { name: 'hooks' }],
    })
  })

  it('scopes the ownership check by userId and id', async () => {
    findFirst.mockResolvedValueOnce(null)
    await updateItem('user-1', 'item-1', baseInput)
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: 'item-1', userId: 'user-1' })
  })

  it('returns the refreshed ItemDetail after a successful update', async () => {
    findFirst.mockResolvedValueOnce({ id: 'item-1' })
    stubDetail()
    const result = await updateItem('user-1', 'item-1', baseInput)
    expect(result?.title).toBe('New title')
    expect(result?.tags).toEqual(['react', 'hooks'])
  })
})

describe('createItem', () => {
  const baseInput = {
    itemTypeId: 'type-1',
    contentType: 'TEXT' as const,
    title: 'New item',
    description: null,
    content: 'console.log()',
    url: null,
    language: 'typescript',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    tags: ['react', 'hooks'],
  }

  function stubCreatedDetail(id = 'item-new') {
    const date = new Date('2026-05-15T00:00:00Z')
    findFirst.mockResolvedValueOnce({
      id,
      title: 'New item',
      description: null,
      contentType: 'TEXT',
      content: 'console.log()',
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: 'typescript',
      isPinned: false,
      isFavorite: false,
      createdAt: date,
      updatedAt: date,
      tags: [{ name: 'react' }, { name: 'hooks' }],
      collections: [],
      itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
    })
  }

  beforeEach(() => {
    findFirst.mockReset()
    itemCreate.mockReset()
    tagUpsert.mockReset()
    transaction.mockClear()
  })

  it('upserts each tag and creates the item with tag connects', async () => {
    itemCreate.mockResolvedValueOnce({ id: 'item-new' })
    stubCreatedDetail()
    await createItem('user-1', baseInput)

    expect(tagUpsert).toHaveBeenCalledTimes(2)
    expect(tagUpsert.mock.calls[0][0]).toEqual({
      where: { name: 'react' },
      update: {},
      create: { name: 'react' },
    })

    const createArgs = itemCreate.mock.calls[0][0]
    expect(createArgs.data.userId).toBe('user-1')
    expect(createArgs.data.itemTypeId).toBe('type-1')
    expect(createArgs.data.contentType).toBe('TEXT')
    expect(createArgs.data.title).toBe('New item')
    expect(createArgs.data.tags).toEqual({
      connect: [{ name: 'react' }, { name: 'hooks' }],
    })
  })

  it('returns the refreshed ItemDetail for the new item', async () => {
    itemCreate.mockResolvedValueOnce({ id: 'item-new' })
    stubCreatedDetail()
    const result = await createItem('user-1', baseInput)
    expect(result.id).toBe('item-new')
    expect(result.tags).toEqual(['react', 'hooks'])
    expect(result.type.name).toBe('snippet')
  })

  it('throws when the detail lookup returns null', async () => {
    itemCreate.mockResolvedValueOnce({ id: 'item-new' })
    findFirst.mockResolvedValueOnce(null)
    await expect(createItem('user-1', baseInput)).rejects.toThrow('Failed to load created item')
  })

  it('persists file fields for FILE items', async () => {
    itemCreate.mockResolvedValueOnce({ id: 'item-file' })
    stubCreatedDetail('item-file')
    await createItem('user-1', {
      ...baseInput,
      contentType: 'FILE',
      content: null,
      fileUrl: 'user-1/abc.pdf',
      fileName: 'abc.pdf',
      fileSize: 4096,
    })
    const createArgs = itemCreate.mock.calls[0][0]
    expect(createArgs.data.fileUrl).toBe('user-1/abc.pdf')
    expect(createArgs.data.fileName).toBe('abc.pdf')
    expect(createArgs.data.fileSize).toBe(4096)
  })
})

describe('deleteItem', () => {
  beforeEach(() => {
    findFirst.mockReset()
    itemDelete.mockReset()
  })

  it('returns null and does not call delete when item is not owned', async () => {
    findFirst.mockResolvedValueOnce(null)
    const result = await deleteItem('user-1', 'missing')
    expect(result).toBeNull()
    expect(itemDelete).not.toHaveBeenCalled()
  })

  it('scopes the ownership check by userId and id', async () => {
    findFirst.mockResolvedValueOnce(null)
    await deleteItem('user-1', 'item-1')
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: 'item-1', userId: 'user-1' })
  })

  it('deletes the item by id when owned and returns its fileUrl', async () => {
    findFirst.mockResolvedValueOnce({ id: 'item-1', fileUrl: null })
    itemDelete.mockResolvedValueOnce({})
    const result = await deleteItem('user-1', 'item-1')
    expect(result).toEqual({ fileUrl: null })
    expect(itemDelete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
  })

  it('returns the stored fileUrl so the caller can clean up R2', async () => {
    findFirst.mockResolvedValueOnce({ id: 'item-1', fileUrl: 'user-1/abc.pdf' })
    itemDelete.mockResolvedValueOnce({})
    const result = await deleteItem('user-1', 'item-1')
    expect(result).toEqual({ fileUrl: 'user-1/abc.pdf' })
  })
})
