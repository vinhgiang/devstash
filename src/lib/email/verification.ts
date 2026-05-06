import "server-only"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import VerificationEmail from "@/emails/VerificationEmail"

interface SendVerificationEmailParams {
  to: string
  name?: string | null
  verifyUrl: string
}

export async function sendVerificationEmail({ to, name, verifyUrl }: SendVerificationEmailParams) {
  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your email — DevStash",
    react: VerificationEmail({ name, verifyUrl }),
  })

  if (error) throw new Error(`Failed to send verification email: ${error.message}`)
}
