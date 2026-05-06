import "server-only"
import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export async function createVerificationToken(email: string) {
  const identifier = email.trim().toLowerCase()
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + TOKEN_TTL_MS)

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({ data: { identifier, token, expires } })

  return token
}

export type ConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "not_found" | "expired" }

export async function consumeVerificationToken(token: string): Promise<ConsumeResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record) return { ok: false, reason: "not_found" }

  await prisma.verificationToken.delete({ where: { token } })

  if (record.expires < new Date()) return { ok: false, reason: "expired" }

  return { ok: true, email: record.identifier }
}

export function buildVerifyUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return `${base.replace(/\/$/, "")}/api/auth/verify?token=${token}`
}
