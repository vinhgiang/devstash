import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadObject } from '@/lib/r2'
import { getExtension, validateUpload, type UploadCategory } from '@/lib/constants/file-upload'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 })
  }

  const file = formData.get('file')
  const category = formData.get('category')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was provided.' }, { status: 400 })
  }
  if (category !== 'file' && category !== 'image') {
    return NextResponse.json({ error: 'Invalid file category.' }, { status: 400 })
  }

  const validation = validateUpload({
    category: category as UploadCategory,
    name: file.name,
    size: file.size,
    type: file.type,
  })
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const key = `${session.user.id}/${randomUUID()}${getExtension(file.name)}`

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    await uploadObject(key, bytes, file.type || 'application/octet-stream')
  } catch (err) {
    console.error('upload failed:', err)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    key,
    fileName: file.name,
    fileSize: file.size,
  })
}
