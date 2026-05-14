import "server-only"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type DurationUnit = "ms" | "s" | "m" | "h" | "d"
type Duration = `${number} ${DurationUnit}`

interface LimiterConfig {
  tokens: number
  window: Duration
  prefix: string
}

const LIMITERS = {
  login: { tokens: 5, window: "15 m", prefix: "rl:auth:login" },
  register: { tokens: 3, window: "1 h", prefix: "rl:auth:register" },
  forgotPassword: { tokens: 3, window: "1 h", prefix: "rl:auth:forgot" },
  resetPassword: { tokens: 5, window: "15 m", prefix: "rl:auth:reset" },
  resendVerification: { tokens: 3, window: "15 m", prefix: "rl:auth:resend-verify" },
} as const satisfies Record<string, LimiterConfig>

export type LimiterName = keyof typeof LIMITERS

let redisClient: Redis | null | undefined
const limiterCache: Partial<Record<LimiterName, Ratelimit>> = {}

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisClient = null
    return null
  }
  redisClient = new Redis({ url, token })
  return redisClient
}

function getLimiter(name: LimiterName): Ratelimit | null {
  const cached = limiterCache[name]
  if (cached) return cached
  const redis = getRedis()
  if (!redis) return null
  const cfg = LIMITERS[name]
  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
    prefix: cfg.prefix,
    analytics: false,
  })
  limiterCache[name] = instance
  return instance
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
  retryAfterSeconds: number
}

const ALLOW: RateLimitResult = {
  success: true,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
  limit: Number.POSITIVE_INFINITY,
  retryAfterSeconds: 0,
}

export async function checkRateLimit(
  name: LimiterName,
  key: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name)
  if (!limiter) return ALLOW
  try {
    const r = await limiter.limit(key)
    return {
      success: r.success,
      remaining: r.remaining,
      reset: r.reset,
      limit: r.limit,
      retryAfterSeconds: Math.max(0, Math.ceil((r.reset - Date.now()) / 1000)),
    }
  } catch (err) {
    console.error(`[rate-limit:${name}] check failed, failing open:`, err)
    return ALLOW
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "anonymous"
}

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60))
  return minutes === 1
    ? "Too many attempts. Please try again in 1 minute."
    : `Too many attempts. Please try again in ${minutes} minutes.`
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { error: rateLimitMessage(result.retryAfterSeconds) },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds || 60),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  )
}
