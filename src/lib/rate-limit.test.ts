import { describe, it, expect } from "vitest"
import { getClientIp, rateLimitMessage } from "./rate-limit"

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/test", { headers })
}

describe("getClientIp", () => {
  it("returns the first entry from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const req = makeRequest({ "x-real-ip": "9.9.9.9" })
    expect(getClientIp(req)).toBe("9.9.9.9")
  })

  it("returns 'anonymous' when no IP headers are present", () => {
    expect(getClientIp(makeRequest({}))).toBe("anonymous")
  })
})

describe("rateLimitMessage", () => {
  it("uses singular phrasing under a minute", () => {
    expect(rateLimitMessage(30)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    )
  })

  it("rounds up to the next whole minute", () => {
    expect(rateLimitMessage(61)).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    )
  })
})
