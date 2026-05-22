import { auth } from '@/auth'
import { getItemDetail } from '@/lib/db/items'
import { getObject } from '@/lib/r2'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const item = await getItemDetail(session.user.id, id)
  if (!item || item.contentType !== 'FILE' || !item.fileUrl) {
    return new Response('Not found', { status: 404 })
  }

  let object
  try {
    object = await getObject(item.fileUrl)
  } catch (err) {
    console.error('file proxy failed:', err)
    return new Response('Failed to load file', { status: 502 })
  }
  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  const asDownload = new URL(req.url).searchParams.get('download') === '1'
  const fileName = item.fileName ?? 'download'
  const disposition = `${asDownload ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(fileName)}`

  return new Response(Buffer.from(object.body), {
    status: 200,
    headers: {
      'Content-Type': object.contentType,
      'Content-Length': String(object.contentLength),
      'Content-Disposition': disposition,
      // Neutralizes scripted SVGs if the proxy URL is opened directly.
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300',
    },
  })
}
