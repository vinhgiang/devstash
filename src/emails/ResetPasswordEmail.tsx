import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface ResetPasswordEmailProps {
  name?: string | null
  resetUrl: string
}

export default function ResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi,"

  return (
    <Html>
      <Head />
      <Preview>Reset your DevStash password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            We received a request to reset your DevStash password. Click the button below to choose a new one.
          </Text>
          <Section style={buttonSection}>
            <Button href={resetUrl} style={button}>
              Reset password
            </Button>
          </Section>
          <Text style={smallParagraph}>Or copy and paste this URL into your browser:</Text>
          <Text style={urlParagraph}>
            <Link href={resetUrl} style={urlLink}>
              {resetUrl}
            </Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            This link expires in 24 hours. If you didn&apos;t request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  margin: 0,
  padding: 0,
}

const container = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  padding: "32px",
  maxWidth: "480px",
  borderRadius: "8px",
}

const heading = {
  color: "#111111",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 16px",
}

const paragraph = {
  color: "#111111",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
}

const smallParagraph = {
  color: "#555555",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 4px",
}

const urlParagraph = {
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px",
  wordBreak: "break-all" as const,
}

const urlLink = {
  color: "#3b82f6",
  textDecoration: "underline",
}

const buttonSection = {
  margin: "8px 0 24px",
}

const button = {
  backgroundColor: "#111111",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 20px",
  textDecoration: "none",
}

const hr = {
  borderColor: "#eeeeee",
  margin: "24px 0",
}

const footer = {
  color: "#777777",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
}
