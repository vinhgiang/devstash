import { describe, it, expect, vi, beforeEach } from 'vitest'

const itemFindMany = vi.fn()
const collectionFindMany = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: { findMany: (...args: unknown[]) => itemFindMany(...args) },
    collection: { findMany: (...args: unknown[]) => collectionFindMany(...args) },
  },
}))

import { getSearchableData } from './search'

describe('getSearchableData', () => {
  beforeEach(() => {
    itemFindMany.mockReset()
    collectionFindMany.mockReset()
  })

  it('scopes both queries to the userId', async () => {
    itemFindMany.mockResolvedValueOnce([])
    collectionFindMany.mockResolvedValueOnce([])
    await getSearchableData('user-1')
    expect(itemFindMany.mock.calls[0][0].where).toEqual({ userId: 'user-1' })
    expect(collectionFindMany.mock.calls[0][0].where).toEqual({ userId: 'user-1' })
  })

  it('maps items with preview falling back to content then url then fileName', async () => {
    itemFindMany.mockResolvedValueOnce([
      {
        id: 'i1',
        title: 'Hook',
        description: 'use auth hook',
        content: 'const x = 1',
        url: null,
        fileName: null,
        itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
      },
      {
        id: 'i2',
        title: 'Link',
        description: null,
        content: null,
        url: 'https://example.com',
        fileName: null,
        itemType: { name: 'link', icon: 'Link', color: '#10b981' },
      },
      {
        id: 'i3',
        title: 'File',
        description: null,
        content: null,
        url: null,
        fileName: 'doc.pdf',
        itemType: { name: 'file', icon: 'File', color: '#6b7280' },
      },
    ])
    collectionFindMany.mockResolvedValueOnce([])
    const result = await getSearchableData('user-1')
    expect(result.items).toEqual([
      {
        id: 'i1',
        title: 'Hook',
        preview: 'use auth hook',
        type: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
      },
      {
        id: 'i2',
        title: 'Link',
        preview: 'https://example.com',
        type: { name: 'link', icon: 'Link', color: '#10b981' },
      },
      {
        id: 'i3',
        title: 'File',
        preview: 'doc.pdf',
        type: { name: 'file', icon: 'File', color: '#6b7280' },
      },
    ])
  })

  it('truncates long previews to 120 chars with an ellipsis', async () => {
    const long = 'a'.repeat(200)
    itemFindMany.mockResolvedValueOnce([
      {
        id: 'i1',
        title: 'Long',
        description: long,
        content: null,
        url: null,
        fileName: null,
        itemType: { name: 'note', icon: 'StickyNote', color: '#fde047' },
      },
    ])
    collectionFindMany.mockResolvedValueOnce([])
    const result = await getSearchableData('user-1')
    expect(result.items[0].preview).toBe('a'.repeat(120) + '…')
  })

  it('collapses whitespace in preview', async () => {
    itemFindMany.mockResolvedValueOnce([
      {
        id: 'i1',
        title: 'Whitespace',
        description: 'one\n\ntwo  three',
        content: null,
        url: null,
        fileName: null,
        itemType: { name: 'note', icon: 'StickyNote', color: '#fde047' },
      },
    ])
    collectionFindMany.mockResolvedValueOnce([])
    const result = await getSearchableData('user-1')
    expect(result.items[0].preview).toBe('one two three')
  })

  it('maps collections with itemCount from _count.items', async () => {
    itemFindMany.mockResolvedValueOnce([])
    collectionFindMany.mockResolvedValueOnce([
      { id: 'c1', name: 'React', _count: { items: 5 } },
      { id: 'c2', name: 'Python', _count: { items: 0 } },
    ])
    const result = await getSearchableData('user-1')
    expect(result.collections).toEqual([
      { id: 'c1', name: 'React', itemCount: 5 },
      { id: 'c2', name: 'Python', itemCount: 0 },
    ])
  })

  it('returns empty preview when no content sources exist', async () => {
    itemFindMany.mockResolvedValueOnce([
      {
        id: 'i1',
        title: 'Empty',
        description: null,
        content: null,
        url: null,
        fileName: null,
        itemType: { name: 'note', icon: 'StickyNote', color: '#fde047' },
      },
    ])
    collectionFindMany.mockResolvedValueOnce([])
    const result = await getSearchableData('user-1')
    expect(result.items[0].preview).toBe('')
  })
})
