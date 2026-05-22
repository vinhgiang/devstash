import 'server-only'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is not set`)
  }
  return value
}

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  const accountId = requireEnv('R2_ACCOUNT_ID')
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    // R2 rejects the flexible-checksum trailers newer aws-sdk versions
    // send by default, so only compute/validate them when truly required.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return client
}

export async function uploadObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: requireEnv('R2_BUCKET_NAME'),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export interface R2Object {
  body: Uint8Array
  contentType: string
  contentLength: number
}

export async function getObject(key: string): Promise<R2Object | null> {
  try {
    const res = await getClient().send(
      new GetObjectCommand({
        Bucket: requireEnv('R2_BUCKET_NAME'),
        Key: key,
      }),
    )
    if (!res.Body) return null
    const body = await res.Body.transformToByteArray()
    return {
      body,
      contentType: res.ContentType ?? 'application/octet-stream',
      contentLength: res.ContentLength ?? body.byteLength,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'NoSuchKey') return null
    throw err
  }
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: requireEnv('R2_BUCKET_NAME'),
      Key: key,
    }),
  )
}
