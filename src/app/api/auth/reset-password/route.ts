import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { consumePasswordResetToken } from "@/lib/auth/verification-token"
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const limit = await checkRateLimit("resetPassword", getClientIp(req))
  if (!limit.success) return rateLimitResponse(limit)

  const body = await req.json().catch(() => null)
  const { token, password, confirmPassword } = body ?? {}

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required." }, { status: 400 })
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    )
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 })
  }

  const result = await consumePasswordResetToken(token)

  if (!result.ok) {
    const isExpired = result.reason === "expired"
    return NextResponse.json(
      {
        error: isExpired
          ? "This reset link has expired. Please request a new one."
          : "This reset link is invalid or has already been used.",
        code: isExpired ? "reset_expired" : "reset_invalid",
      },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { email: result.email }, data: { password: hashed } })

  return NextResponse.json({ success: true })
}
