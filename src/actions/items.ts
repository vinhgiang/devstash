'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items'

const nullableString = z
  .string()
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null))

const trimmedNullableString = z
  .string()
  .nullish()
  .transform((v) => {
    const trimmed = v?.trim() ?? ''
    return trimmed.length > 0 ? trimmed : null
  })

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: nullableString,
  content: nullableString,
  language: trimmedNullableString,
  url: z
    .string()
    .nullish()
    .transform((v, ctx) => {
      const trimmed = v?.trim() ?? ''
      if (trimmed.length === 0) return null
      try {
        new URL(trimmed)
        return trimmed
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Must be a valid URL' })
        return z.NEVER
      }
    }),
  tags: z
    .array(z.string())
    .transform((arr) =>
      Array.from(
        new Set(arr.map((t) => t.trim()).filter((t) => t.length > 0)),
      ),
    ),
})

export type UpdateItemPayload = z.input<typeof updateItemSchema>

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = updateItemSchema.safeParse(payload)
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
    const updated = await updateItemQuery(session.user.id, itemId, parsed.data)
    if (!updated) {
      return { success: false, error: 'Item not found.' }
    }
    return { success: true, data: updated }
  } catch (err) {
    console.error('updateItem failed:', err)
    return { success: false, error: 'Failed to save changes.' }
  }
}

export async function deleteItem(
  itemId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' }
  }

  try {
    const deleted = await deleteItemQuery(session.user.id, itemId)
    if (!deleted) {
      return { success: false, error: 'Item not found.' }
    }
    return { success: true, data: { id: itemId } }
  } catch (err) {
    console.error('deleteItem failed:', err)
    return { success: false, error: 'Failed to delete item.' }
  }
}
