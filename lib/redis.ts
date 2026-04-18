import { createClient, type RedisClientType } from "redis"

import { env } from "@/lib/env"

type GlobalWithRedis = typeof globalThis & {
  __sohojatraRedis?: {
    client: RedisClientType | null
    connecting: Promise<RedisClientType> | null
  }
}

const globalRef = globalThis as GlobalWithRedis
globalRef.__sohojatraRedis ??= { client: null, connecting: null }

function isRedisConfigured() {
  return Boolean(env.REDIS_URL || (env.REDIS_HOST && env.REDIS_PASSWORD))
}

function buildClient(): RedisClientType {
  if (env.REDIS_URL) {
    return createClient({ url: env.REDIS_URL }) as RedisClientType
  }

  return createClient({
    username: env.REDIS_USERNAME || "default",
    password: env.REDIS_PASSWORD,
    socket: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
  }) as RedisClientType
}

export async function getRedis(): Promise<RedisClientType | null> {
  if (!isRedisConfigured()) return null

  const state = globalRef.__sohojatraRedis!
  if (state.client && state.client.isOpen) return state.client

  if (!state.connecting) {
    const client = buildClient()
    client.on("error", (err) => {
      console.error("[redis] client error:", err)
    })

    state.connecting = client
      .connect()
      .then(() => {
        state.client = client
        return client
      })
      .catch((err) => {
        state.connecting = null
        state.client = null
        throw err
      })
  }

  return state.connecting
}

/**
 * Fixed-window rate limiter backed by Redis.
 * Returns true when the caller has exceeded `max` hits in `windowSeconds`.
 */
export async function isRateLimited(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const client = await getRedis().catch(() => null)
  if (!client) return false

  const fullKey = `sohojatra:rl:${key}`
  const count = await client.incr(fullKey)
  if (count === 1) {
    await client.expire(fullKey, windowSeconds)
  }
  return count > max
}
