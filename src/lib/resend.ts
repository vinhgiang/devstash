import "server-only"
import { Resend } from "resend"

let client: Resend | null = null

export function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Add it to your .env file.")
  }
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "DevStash <onboarding@resend.dev>"
