export type UploadCategory = 'file' | 'image'

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const FILE_MAX_BYTES = 10 * 1024 * 1024

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] as const
export const FILE_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.csv',
  '.toml',
  '.ini',
] as const

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

export const FILE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/toml',
] as const

interface CategoryConfig {
  label: string
  maxBytes: number
  maxLabel: string
  extensions: readonly string[]
}

const CATEGORY_CONFIG: Record<UploadCategory, CategoryConfig> = {
  image: {
    label: 'Image',
    maxBytes: IMAGE_MAX_BYTES,
    maxLabel: '5 MB',
    extensions: IMAGE_EXTENSIONS,
  },
  file: {
    label: 'File',
    maxBytes: FILE_MAX_BYTES,
    maxLabel: '10 MB',
    extensions: FILE_EXTENSIONS,
  },
}

export function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot).toLowerCase()
}

export interface UploadValidationInput {
  category: UploadCategory
  name: string
  size: number
  type: string
}

export type UploadValidation = { ok: true } | { ok: false; error: string }

export function validateUpload(input: UploadValidationInput): UploadValidation {
  const config = CATEGORY_CONFIG[input.category]

  if (input.size <= 0) {
    return { ok: false, error: 'The selected file is empty.' }
  }
  if (input.size > config.maxBytes) {
    return {
      ok: false,
      error: `${config.label}s must be ${config.maxLabel} or smaller.`,
    }
  }

  const ext = getExtension(input.name)
  if (!ext || !config.extensions.includes(ext)) {
    return {
      ok: false,
      error: `"${ext || input.name}" is not a supported ${config.label.toLowerCase()} type.`,
    }
  }

  const mime = input.type.toLowerCase()
  if (mime) {
    if (input.category === 'image' && !mime.startsWith('image/')) {
      return { ok: false, error: 'The selected file is not an image.' }
    }
    if (input.category === 'file' && mime.startsWith('image/')) {
      return { ok: false, error: 'Use the Image type to upload images.' }
    }
  }

  return { ok: true }
}

export function acceptAttribute(category: UploadCategory): string {
  return CATEGORY_CONFIG[category].extensions.join(',')
}

export function maxSizeLabel(category: UploadCategory): string {
  return CATEGORY_CONFIG[category].maxLabel
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
