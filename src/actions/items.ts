'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemTypeBySlug,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items'
import { deleteObject } from '@/lib/r2'

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

const CREATABLE_TYPE_SLUGS = [
  'snippet',
  'prompt',
  'command',
  'note',
  'link',
  'file',
  'image',
] as const
type CreatableTypeSlug = (typeof CREATABLE_TYPE_SLUGS)[number]

const TYPES_WITH_CONTENT: ReadonlySet<CreatableTypeSlug> = new Set([
  'snippet',
  'prompt',
  'command',
  'note',
])
const TYPES_WITH_LANGUAGE: ReadonlySet<CreatableTypeSlug> = new Set(['snippet', 'command'])
const TYPES_WITH_FILE: ReadonlySet<CreatableTypeSlug> = new Set(['file', 'image'])

const urlField = z
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
  })

const tagsField = z
  .array(z.string())
  .transform((arr) =>
    Array.from(new Set(arr.map((t) => t.trim()).filter((t) => t.length > 0))),
  )

const fileSizeField = z
  .number()
  .int()
  .positive()
  .nullish()
  .transform((v) => v ?? null)

const createItemSchema = z
  .object({
    typeSlug: z.enum(CREATABLE_TYPE_SLUGS),
    title: z.string().trim().min(1, 'Title is required'),
    description: nullableString,
    content: nullableString,
    language: trimmedNullableString,
    url: urlField,
    fileKey: nullableString,
    fileName: nullableString,
    fileSize: fileSizeField,
    tags: tagsField,
  })
  .superRefine((data, ctx) => {
    if (data.typeSlug === 'link' && !data.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'URL is required',
      })
    }
    if (TYPES_WITH_FILE.has(data.typeSlug) && !data.fileKey) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileKey'],
        message: 'A file is required',
      })
    }
  })

export type CreateItemPayload = z.input<typeof createItemSchema>

export async function createItem(
  payload: CreateItemPayload,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = createItemSchema.safeParse(payload)
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
    const type = await getItemTypeBySlug(parsed.data.typeSlug)
    if (!type) {
      return { success: false, error: 'Item type not found.' }
    }

    const slug = parsed.data.typeSlug
    const isFileType = TYPES_WITH_FILE.has(slug)
    const contentType: 'TEXT' | 'URL' | 'FILE' = slug === 'link'
      ? 'URL'
      : isFileType
        ? 'FILE'
        : 'TEXT'

    const created = await createItemQuery(session.user.id, {
      itemTypeId: type.id,
      contentType,
      title: parsed.data.title,
      description: parsed.data.description,
      content: TYPES_WITH_CONTENT.has(slug) ? parsed.data.content : null,
      url: slug === 'link' ? parsed.data.url : null,
      language: TYPES_WITH_LANGUAGE.has(slug) ? parsed.data.language : null,
      fileUrl: isFileType ? parsed.data.fileKey : null,
      fileName: isFileType ? parsed.data.fileName : null,
      fileSize: isFileType ? parsed.data.fileSize : null,
      tags: parsed.data.tags,
    })
    return { success: true, data: created }
  } catch (err) {
    console.error('createItem failed:', err)
    return { success: false, error: 'Failed to create item.' }
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
    if (deleted.fileUrl) {
      try {
        await deleteObject(deleted.fileUrl)
      } catch (err) {
        // The item row is already gone; an orphaned R2 object is preferable
        // to surfacing an error for an otherwise-successful delete.
        console.error('R2 cleanup failed for', deleted.fileUrl, err)
      }
    }
    return { success: true, data: { id: itemId } }
  } catch (err) {
    console.error('deleteItem failed:', err)
    return { success: false, error: 'Failed to delete item.' }
  }
}
