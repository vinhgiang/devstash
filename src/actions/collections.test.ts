import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const createCollectionQuery = vi.fn()

vi.mock('@/auth', () => ({ auth: (...args: unknown[]) => auth(...args) }))
vi.mock('@/lib/db/collections', () => ({
  createCollection: (...args: unknown[]) => createCollectionQuery(...args),
}))

import { createCollection } from './collections'

const validPayload = {
  name: 'React Patterns',
  description: 'reusable hooks',
}

beforeEach(() => {
  auth.mockReset()
  createCollectionQuery.mockReset()
  auth.mockResolvedValue({ user: { id: 'user-1' } })
})

describe('createCollection action - auth', () => {
  it('returns an error when there is no session', async () => {
    auth.mockResolvedValueOnce(null)
    const result = await createCollection(validPayload)
    expect(result).toEqual({ success: false, error: 'You must be signed in.' })
    expect(createCollectionQuery).not.toHaveBeenCalled()
  })
})

describe('createCollection action - validation', () => {
  it('rejects an empty name', async () => {
    const result = await createCollection({ ...validPayload, name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.name?.[0]).toBe('Name is required')
    }
    expect(createCollectionQuery).not.toHaveBeenCalled()
  })

  it('normalizes a blank description to null', async () => {
    createCollectionQuery.mockResolvedValueOnce({ id: 'col-1' })
    await createCollection({ name: 'X', description: '   ' })
    const [, data] = createCollectionQuery.mock.calls[0]
    expect(data.description).toBeNull()
  })

  it('normalizes an undefined description to null', async () => {
    createCollectionQuery.mockResolvedValueOnce({ id: 'col-1' })
    await createCollection({ name: 'X' } as { name: string; description?: string })
    const [, data] = createCollectionQuery.mock.calls[0]
    expect(data.description).toBeNull()
  })

  it('trims the name before persisting', async () => {
    createCollectionQuery.mockResolvedValueOnce({ id: 'col-1' })
    await createCollection({ name: '  React Patterns  ', description: null })
    const [, data] = createCollectionQuery.mock.calls[0]
    expect(data.name).toBe('React Patterns')
  })
})

describe('createCollection action - persistence', () => {
  it('returns success with the created collection from the query', async () => {
    const col = {
      id: 'col-1',
      name: 'React Patterns',
      description: 'reusable hooks',
      isFavorite: false,
      createdAt: '2026-05-25T12:00:00.000Z',
      updatedAt: '2026-05-25T12:00:00.000Z',
    }
    createCollectionQuery.mockResolvedValueOnce(col)
    const result = await createCollection(validPayload)
    expect(result).toEqual({ success: true, data: col })
    expect(createCollectionQuery).toHaveBeenCalledWith('user-1', {
      name: 'React Patterns',
      description: 'reusable hooks',
    })
  })

  it('returns a generic error when the query throws', async () => {
    createCollectionQuery.mockRejectedValueOnce(new Error('boom'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await createCollection(validPayload)
    expect(result).toEqual({ success: false, error: 'Failed to create collection.' })
    errSpy.mockRestore()
  })
})
