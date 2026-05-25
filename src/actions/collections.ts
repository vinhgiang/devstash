'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  type CollectionRow,
} from '@/lib/db/collections'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

const trimmedNullableString = z
  .string()
  .nullish()
  .transform((v) => {
    const trimmed = v?.trim() ?? ''
    return trimmed.length > 0 ? trimmed : null
  })

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: trimmedNullableString,
})

export type CreateCollectionPayload = z.input<typeof createCollectionSchema>

export async function createCollection(
  payload: CreateCollectionPayload,
): Promise<ActionResult<CollectionRow>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = createCollectionSchema.safeParse(payload)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const firstFieldError = Object.values(flat.fieldErrors).flat()[0]
    return {
      success: false,
      error: firstFieldError ?? 'Invalid input',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data)
    return { success: true, data: created }
  } catch (err) {
    console.error('createCollection failed:', err)
    return { success: false, error: 'Failed to create collection.' }
  }
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: trimmedNullableString,
})

export type UpdateCollectionPayload = z.input<typeof updateCollectionSchema>

export async function updateCollection(
  collectionId: string,
  payload: UpdateCollectionPayload,
): Promise<ActionResult<CollectionRow>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = updateCollectionSchema.safeParse(payload)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const firstFieldError = Object.values(flat.fieldErrors).flat()[0]
    return {
      success: false,
      error: firstFieldError ?? 'Invalid input',
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const updated = await updateCollectionQuery(session.user.id, collectionId, parsed.data)
    if (!updated) return { success: false, error: 'Collection not found.' }
    return { success: true, data: updated }
  } catch (err) {
    console.error('updateCollection failed:', err)
    return { success: false, error: 'Failed to update collection.' }
  }
}

export async function deleteCollection(collectionId: string): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' }
  }

  try {
    const deleted = await deleteCollectionQuery(session.user.id, collectionId)
    if (!deleted) return { success: false, error: 'Collection not found.' }
    return { success: true, data: null }
  } catch (err) {
    console.error('deleteCollection failed:', err)
    return { success: false, error: 'Failed to delete collection.' }
  }
}
