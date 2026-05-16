import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const updateItemQuery = vi.fn()

vi.mock('@/auth', () => ({ auth: (...args: unknown[]) => auth(...args) }))
vi.mock('@/lib/db/items', () => ({
  updateItem: (...args: unknown[]) => updateItemQuery(...args),
}))

import { updateItem } from './items'

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
