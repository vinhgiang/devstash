import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeVerificationToken } from "@/lib/auth/verification-token"

function redirect(req: Request, params: Record<string, string>) {
  const url = new URL("/sign-in", req.url)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) return redirect(req, { error: "verify_invalid" })

  const result = await consumeVerificationToken(token)
  if (!result.ok) {
    return redirect(req, { error: result.reason === "expired" ? "verify_expired" : "verify_invalid" })
  }

  const user = await prisma.user.findUnique({ where: { email: result.email } })
  if (!user) return redirect(req, { error: "verify_invalid" })

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
  }

  return redirect(req, { verified: "1" })
}
