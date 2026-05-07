import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPasswordResetToken, buildPasswordResetUrl } from "@/lib/auth/verification-token"
import { sendPasswordResetEmail } from "@/lib/email/reset-password"

const OK = NextResponse.json(
  { message: "If an account with that email exists, a reset link has been sent." },
  { status: 200 }
)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const rawEmail = body?.email

  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  const email = rawEmail.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, password: true },
  })

  // No account or OAuth-only account — return same OK to prevent enumeration
  if (!user?.password) return OK

  try {
    const token = await createPasswordResetToken(email)
    const resetUrl = buildPasswordResetUrl(token)
    await sendPasswordResetEmail({ to: email, name: user.name, resetUrl })
  } catch (err) {
    console.error("Failed to send password reset email:", err)
  }

  return OK
}
