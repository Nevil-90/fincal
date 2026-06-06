import Redis from 'ioredis'

// Ensure we don't create multiple connections in development due to hot-reloading
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Treat empty string as "not configured" — avoids ioredis connecting to invalid host
const redisUrl = process.env.REDIS_URL?.trim() || undefined
export let redis: Redis | undefined = undefined

function getRedis(): Redis | undefined {
  // No URL → skip Redis entirely, use memory fallback
  if (!redisUrl) return undefined

  // Reuse existing connection across hot-reloads in dev
  if (globalForRedis.redis) {
    redis = globalForRedis.redis
    return redis
  }

  if (!redis) {
    redis = new Redis(redisUrl, {
      // Fail fast — don't block for 20 retries (default) when Redis is down
      maxRetriesPerRequest: 1,
      // Don't retry reconnecting forever; back off quickly
      retryStrategy: (times) => {
        if (times > 3) return null  // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000)
      },
      // Suppress unhandled error events — we handle errors in isRateLimited()
      enableOfflineQueue: false,
      lazyConnect: false,
    })

    redis.on('error', () => {
      // Suppress unhandled error events — errors are caught in isRateLimited()
    })

    if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redis = redis
    }
  }
  return redis
}

// Fallback if Redis is down or not configured
const memoryFallback = new Map<string, { count: number, resetAt: number }>()

/**
 * Checks if a specific key has exceeded its rate limit.
 * Uses a fixed-window algorithm backed by Redis (or memory fallback).
 *
 * @param key - The unique identifier for the limit (e.g., "login:192.168.1.1")
 * @param limit - Maximum allowed requests in the window
 * @param windowMs - The time window in milliseconds
 * @returns boolean - true if the limit is exceeded, false otherwise
 */
export async function isRateLimited(key: string, limit = 5, windowMs = 60000): Promise<boolean> {
  const activeRedis = getRedis()

  // No Redis configured → use memory fallback silently (no error, no delay)
  if (!activeRedis) {
    return memoryRateLimit(key, limit, windowMs)
  }

  try {
    const currentCount = await activeRedis.incr(key)
    if (currentCount === 1) {
      await activeRedis.pexpire(key, windowMs)
    }
    return currentCount > limit
  } catch (error) {
    // Redis is configured but failed — log and fall back to memory
    console.error('Redis Rate Limiter Error, using memory fallback:', error)
    return memoryRateLimit(key, limit, windowMs)
  }
}

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  // Inline memory cleanup to prevent unbounded growth
  if (memoryFallback.size > 1000) {
    const nowCleanup = Date.now()
    for (const [k, v] of memoryFallback.entries()) {
      if (nowCleanup > v.resetAt) memoryFallback.delete(k)
    }
  }

  const now = Date.now()
  const entry = memoryFallback.get(key)

  if (!entry || now > entry.resetAt) {
    memoryFallback.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count += 1
  return entry.count > limit
}
