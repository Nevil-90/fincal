// Rate limiting using Redis with an in-memory fallback.
// Uses a fixed-window algorithm. Falls back to memory-based limiting
// when Redis is not configured or unavailable.

import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

const redisUrl = process.env.REDIS_URL?.trim() || undefined
export let redis: Redis | undefined = undefined

function getRedis(): Redis | undefined {
  if (!redisUrl) return undefined

  if (globalForRedis.redis) {
    redis = globalForRedis.redis
    return redis
  }

  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 200, 1000)
      },
      enableOfflineQueue: false,
      lazyConnect: false,
    })

    redis.on('error', () => {
      // Errors are caught in isRateLimited()
    })

    if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redis = redis
    }
  }
  return redis
}

const memoryFallback = new Map<string, { count: number, resetAt: number }>()

/**
 * Returns true if the given key has exceeded the rate limit for the current window.
 *
 * @param key - Unique identifier for the limit (e.g. "login:192.168.1.1")
 * @param limit - Max allowed requests per window
 * @param windowMs - Window duration in milliseconds
 */
export async function isRateLimited(key: string, limit = 5, windowMs = 60000): Promise<boolean> {
  const activeRedis = getRedis()

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
    console.error('Redis Rate Limiter Error, using memory fallback:', error)
    return memoryRateLimit(key, limit, windowMs)
  }
}

function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  if (memoryFallback.size > 1000) {
    const now = Date.now()
    for (const [k, v] of memoryFallback.entries()) {
      if (now > v.resetAt) memoryFallback.delete(k)
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
