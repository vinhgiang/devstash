// Set REQUIRE_EMAIL_VERIFICATION=false in .env to bypass verification in dev
// (useful when no Resend domain is configured). Any other value keeps it on.
export const EMAIL_VERIFICATION_REQUIRED = process.env.REQUIRE_EMAIL_VERIFICATION !== "false"
