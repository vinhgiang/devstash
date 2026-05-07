import "server-only"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import ResetPasswordEmail from "@/emails/ResetPasswordEmail"

interface SendPasswordResetEmailParams {
  to: string
  name?: string | null
  resetUrl: string
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: SendPasswordResetEmailParams) {
  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Reset your password — DevStash",
    react: ResetPasswordEmail({ name, resetUrl }),
  })

  if (error) throw new Error(`Failed to send password reset email: ${error.message}`)
}
