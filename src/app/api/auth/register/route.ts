import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { buildVerifyUrl, createVerificationToken } from "@/lib/auth/verification-token"
import { sendVerificationEmail } from "@/lib/email/verification"
import { EMAIL_VERIFICATION_REQUIRED } from "@/lib/auth/config"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { name, email, password, confirmPassword } = body as Record<string, unknown>

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
    },
    select: { id: true, email: true, name: true },
  })

  if (EMAIL_VERIFICATION_REQUIRED) {
    try {
      const token = await createVerificationToken(user.email)
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl: buildVerifyUrl(token),
      })
    } catch (err) {
      console.error("[register] verification email failed:", err)
      return NextResponse.json(
        { error: "Account created, but we couldn't send the verification email. Please try resending." },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ user, verificationSent: EMAIL_VERIFICATION_REQUIRED }, { status: 201 })
}
