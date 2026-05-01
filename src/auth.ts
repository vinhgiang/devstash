import NextAuth, { CredentialsSignin } from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import authConfig from "@/auth.config"

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials"
}

// Constant-time guard against email enumeration: always run bcrypt.compare
// even when the user doesn't exist, so attackers can't time the response.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-not-used", 10)

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : ""
        const password = typeof credentials?.password === "string" ? credentials.password : ""

        if (!email || !password) throw new InvalidCredentialsError()

        const user = await prisma.user.findUnique({ where: { email } })
        const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)
        if (!user || !user.password || !valid) throw new InvalidCredentialsError()

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string
      return session
    },
  },
})
