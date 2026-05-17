import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const updateItemQuery = vi.fn()
const deleteItemQuery = vi.fn()
const createItemQuery = vi.fn()
const getItemTypeBySlug = vi.fn()

vi.mock('@/auth', () => ({ auth: (...args: unknown[]) => auth(...args) }))
vi.mock('@/lib/db/items', () => ({
  updateItem: (...args: unknown[]) => updateItemQuery(...args),
  deleteItem: (...args: unknown[]) => deleteItemQuery(...args),
  createItem: (...args: unknown[]) => createItemQuery(...args),
  getItemTypeBySlug: (...args: unknown[]) => getItemTypeBySlug(...args),
}))

import { createItem, deleteItem, updateItem } from './items'

const validPayload = {
  title: 'My title',
  description: 'desc',
  content: 'console.log()',
  url: null,
  language: 'typescript',
  tags: ['react', 'hooks'],
}

beforeEach(() => {
  auth.mockReset()
  updateItemQuery.mockReset()
  deleteItemQuery.mockReset()
  createItemQuery.mockReset()
  getItemTypeBySlug.mockReset()
  auth.mockResolvedValue({ user: { id: 'user-1' } })
})

describe('updateItem action - auth', () => {
  it('returns an error when there is no session', async () => {
    auth.mockResolvedValueOnce(null)
    const result = await updateItem('item-1', validPayload)
    expect(result).toEqual({ success: false, error: 'You must be signed in.' })
    expect(updateItemQuery).not.toHaveBeenCalled()
  })
})

describe('updateItem action - validation', () => {
  it('rejects an empty title', async () => {
    const result = await updateItem('item-1', { ...validPayload, title: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.title?.[0]).toBe('Title is required')
    }
    expect(updateItemQuery).not.toHaveBeenCalled()
  })

  it('rejects an invalid URL', async () => {
    const result = await updateItem('item-1', { ...validPayload, url: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.url?.[0]).toBe('Must be a valid URL')
    }
  })

  it('normalizes blank optional fields to null', async () => {
    updateItemQuery.mockResolvedValueOnce({ id: 'item-1' })
    await updateItem('item-1', {
      ...validPayload,
      description: '',
      content: '',
      url: '',
      language: '   ',
    })
    const [, , data] = updateItemQuery.mock.calls[0]
    expect(data.description).toBeNull()
    expect(data.content).toBeNull()
    expect(data.url).toBeNull()
    expect(data.language).toBeNull()
  })

  it('trims, deduplicates, and drops empty tag entries', async () => {
    updateItemQuery.mockResolvedValueOnce({ id: 'item-1' })
    await updateItem('item-1', {
      ...validPayload,
      tags: [' react ', 'react', '', 'hooks'],
    })
    const [, , data] = updateItemQuery.mock.calls[0]
    expect(data.tags).toEqual(['react', 'hooks'])
  })
})

describe('updateItem action - persistence', () => {
  it('returns success with the updated item from the query', async () => {
    const item = { id: 'item-1', title: 'My title' }
    updateItemQuery.mockResolvedValueOnce(item)
    const result = await updateItem('item-1', validPayload)
    expect(result).toEqual({ success: true, data: item })
    expect(updateItemQuery).toHaveBeenCalledWith('user-1', 'item-1', expect.any(Object))
  })

  it('returns "not found" when the query returns null', async () => {
    updateItemQuery.mockResolvedValueOnce(null)
    const result = await updateItem('item-1', validPayload)
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('returns a generic error when the query throws', async () => {
    updateItemQuery.mockRejectedValueOnce(new Error('boom'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await updateItem('item-1', validPayload)
    expect(result).toEqual({ success: false, error: 'Failed to save changes.' })
    errSpy.mockRestore()
  })
})

describe('createItem action - auth & validation', () => {
  const snippetPayload = {
    typeSlug: 'snippet' as const,
    title: 'Hello',
    description: '',
    content: 'console.log()',
    url: null,
    language: 'typescript',
    tags: [],
  }

  it('returns an error when there is no session', async () => {
    auth.mockResolvedValueOnce(null)
    const result = await createItem(snippetPayload)
    expect(result).toEqual({ success: false, error: 'You must be signed in.' })
    expect(createItemQuery).not.toHaveBeenCalled()
  })

  it('rejects an empty title', async () => {
    const result = await createItem({ ...snippetPayload, title: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.title?.[0]).toBe('Title is required')
    }
    expect(createItemQuery).not.toHaveBeenCalled()
  })

  it('rejects an unknown type slug', async () => {
    const result = await createItem({
      ...snippetPayload,
      typeSlug: 'bogus' as unknown as 'snippet',
    })
    expect(result.success).toBe(false)
    expect(createItemQuery).not.toHaveBeenCalled()
  })

  it('requires a URL for link items', async () => {
    const result = await createItem({
      typeSlug: 'link',
      title: 'docs',
      description: '',
      content: null,
      url: '',
      language: null,
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.url?.[0]).toBe('URL is required')
    }
  })

  it('rejects an invalid URL on link items', async () => {
    const result = await createItem({
      typeSlug: 'link',
      title: 'docs',
      description: '',
      content: null,
      url: 'not-a-url',
      language: null,
      tags: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.url?.[0]).toBe('Must be a valid URL')
    }
  })
})

describe('createItem action - persistence', () => {
  it('looks up the type, sets contentType TEXT for snippet, drops url/language correctly', async () => {
    getItemTypeBySlug.mockResolvedValueOnce({ id: 'type-snippet', name: 'snippet' })
    createItemQuery.mockResolvedValueOnce({ id: 'item-1' })
    await createItem({
      typeSlug: 'snippet',
      title: 'Hello',
      description: '',
      content: 'console.log()',
      url: null,
      language: 'typescript',
      tags: [' react ', 'react', ''],
    })

    expect(getItemTypeBySlug).toHaveBeenCalledWith('snippet')
    const [userId, data] = createItemQuery.mock.calls[0]
    expect(userId).toBe('user-1')
    expect(data).toMatchObject({
      itemTypeId: 'type-snippet',
      contentType: 'TEXT',
      title: 'Hello',
      description: null,
      content: 'console.log()',
      url: null,
      language: 'typescript',
      tags: ['react'],
    })
  })

  it('sets contentType URL and clears content/language for link items', async () => {
    getItemTypeBySlug.mockResolvedValueOnce({ id: 'type-link', name: 'link' })
    createItemQuery.mockResolvedValueOnce({ id: 'item-2' })
    await createItem({
      typeSlug: 'link',
      title: 'docs',
      description: 'reference',
      content: 'should-be-dropped',
      url: 'https://example.com',
      language: 'should-be-dropped',
      tags: [],
    })
    const [, data] = createItemQuery.mock.calls[0]
    expect(data.contentType).toBe('URL')
    expect(data.url).toBe('https://example.com')
    expect(data.content).toBeNull()
    expect(data.language).toBeNull()
  })

  it('clears language for prompt/note (only kept for snippet/command)', async () => {
    getItemTypeBySlug.mockResolvedValueOnce({ id: 'type-prompt', name: 'prompt' })
    createItemQuery.mockResolvedValueOnce({ id: 'item-3' })
    await createItem({
      typeSlug: 'prompt',
      title: 'Test',
      description: '',
      content: 'Write a haiku',
      url: null,
      language: 'should-be-dropped',
      tags: [],
    })
    const [, data] = createItemQuery.mock.calls[0]
    expect(data.contentType).toBe('TEXT')
    expect(data.language).toBeNull()
    expect(data.content).toBe('Write a haiku')
  })

  it('returns "item type not found" when slug lookup yields null', async () => {
    getItemTypeBySlug.mockResolvedValueOnce(null)
    const result = await createItem({
      typeSlug: 'snippet',
      title: 'Hello',
      description: '',
      content: 'x',
      url: null,
      language: null,
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Item type not found.' })
    expect(createItemQuery).not.toHaveBeenCalled()
  })

  it('returns a generic error when the query throws', async () => {
    getItemTypeBySlug.mockResolvedValueOnce({ id: 'type-snippet', name: 'snippet' })
    createItemQuery.mockRejectedValueOnce(new Error('boom'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await createItem({
      typeSlug: 'snippet',
      title: 'Hello',
      description: '',
      content: 'x',
      url: null,
      language: null,
      tags: [],
    })
    expect(result).toEqual({ success: false, error: 'Failed to create item.' })
    errSpy.mockRestore()
  })

  it('returns success with the created ItemDetail', async () => {
    getItemTypeBySlug.mockResolvedValueOnce({ id: 'type-snippet', name: 'snippet' })
    const detail = { id: 'item-1', title: 'Hello' }
    createItemQuery.mockResolvedValueOnce(detail)
    const result = await createItem({
      typeSlug: 'snippet',
      title: 'Hello',
      description: '',
      content: 'x',
      url: null,
      language: null,
      tags: [],
    })
    expect(result).toEqual({ success: true, data: detail })
  })
})

describe('deleteItem action', () => {
  it('returns an error when there is no session', async () => {
    auth.mockResolvedValueOnce(null)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'You must be signed in.' })
    expect(deleteItemQuery).not.toHaveBeenCalled()
  })

  it('returns success with the deleted item id', async () => {
    deleteItemQuery.mockResolvedValueOnce(true)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: true, data: { id: 'item-1' } })
    expect(deleteItemQuery).toHaveBeenCalledWith('user-1', 'item-1')
  })

  it('returns "not found" when the query returns false', async () => {
    deleteItemQuery.mockResolvedValueOnce(false)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('returns a generic error when the query throws', async () => {
    deleteItemQuery.mockRejectedValueOnce(new Error('boom'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Failed to delete item.' })
    errSpy.mockRestore()
  })
})
