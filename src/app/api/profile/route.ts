import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // VerificationTokens use email as identifier and don't cascade from User deletion
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (user?.email) {
    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } })
    await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${user.email}` } })
  }

  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
