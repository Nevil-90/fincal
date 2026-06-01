import Redis from 'ioredis'

// Ensure we don't create multiple connections in development due to hot-reloading
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

const redisUrl = process.env.REDIS_URL
export let redis: Redis | undefined = globalForRedis.redis

function getRedis() {
  if (!redisUrl) return undefined
  if (!redis) {
    redis = new Redis(redisUrl)
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
  try {
    const activeRedis = getRedis()
    if (activeRedis) {
      const currentCount = await activeRedis.incr(key)
      
      if (currentCount === 1) {
        await activeRedis.pexpire(key, windowMs)
      }

      return currentCount > limit
    }
    // If no redis, intentionally throw to trigger fallback
    throw new Error('Redis not configured')
  } catch (error) {
    console.error('Redis Rate Limiter Error, using memory fallback:', error)
    
    // Inline memory cleanup to prevent unbounded growth leak
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
}
