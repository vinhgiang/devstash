import { describe, it, expect } from 'vitest'
import {
  acceptAttribute,
  FILE_MAX_BYTES,
  formatBytes,
  getExtension,
  IMAGE_MAX_BYTES,
  validateUpload,
} from './file-upload'

describe('getExtension', () => {
  it('returns the lowercased extension with the dot', () => {
    expect(getExtension('Photo.PNG')).toBe('.png')
    expect(getExtension('archive.tar.gz')).toBe('.gz')
  })

  it('returns an empty string when there is no usable extension', () => {
    expect(getExtension('README')).toBe('')
    expect(getExtension('.gitignore')).toBe('')
    expect(getExtension('trailingdot.')).toBe('')
  })
})

describe('validateUpload - images', () => {
  it('accepts a valid image within the size limit', () => {
    expect(
      validateUpload({ category: 'image', name: 'logo.png', size: 1024, type: 'image/png' }),
    ).toEqual({ ok: true })
  })

  it('rejects an image over 5 MB', () => {
    const result = validateUpload({
      category: 'image',
      name: 'huge.png',
      size: IMAGE_MAX_BYTES + 1,
      type: 'image/png',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('5 MB')
  })

  it('rejects an unsupported image extension', () => {
    const result = validateUpload({
      category: 'image',
      name: 'malware.exe',
      size: 1024,
      type: 'application/octet-stream',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects a non-image MIME type for the image category', () => {
    const result = validateUpload({
      category: 'image',
      name: 'fake.png',
      size: 1024,
      type: 'application/pdf',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('not an image')
  })
})

describe('validateUpload - files', () => {
  it('accepts a valid file within the size limit', () => {
    expect(
      validateUpload({ category: 'file', name: 'doc.pdf', size: 2048, type: 'application/pdf' }),
    ).toEqual({ ok: true })
  })

  it('accepts a file with a recognized extension but an empty MIME type', () => {
    expect(
      validateUpload({ category: 'file', name: 'config.toml', size: 512, type: '' }),
    ).toEqual({ ok: true })
    expect(
      validateUpload({ category: 'file', name: 'settings.ini', size: 512, type: '' }),
    ).toEqual({ ok: true })
  })

  it('rejects a file over 10 MB', () => {
    const result = validateUpload({
      category: 'file',
      name: 'big.pdf',
      size: FILE_MAX_BYTES + 1,
      type: 'application/pdf',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('10 MB')
  })

  it('rejects an empty file', () => {
    const result = validateUpload({ category: 'file', name: 'doc.pdf', size: 0, type: 'application/pdf' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('empty')
  })

  it('rejects an image uploaded under the file category', () => {
    const result = validateUpload({
      category: 'file',
      name: 'sneaky.pdf',
      size: 1024,
      type: 'image/png',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Image type')
  })
})

describe('acceptAttribute', () => {
  it('lists comma-separated extensions for the category', () => {
    expect(acceptAttribute('image')).toBe('.png,.jpg,.jpeg,.gif,.webp,.svg')
    expect(acceptAttribute('file')).toContain('.pdf')
  })
})

describe('formatBytes', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})
