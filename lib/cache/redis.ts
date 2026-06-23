import "server-only";

import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

function getRedis() {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<unknown>(key);
    if (!value) return null;
    return typeof value === "string" ? JSON.parse(value) as T : value as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // Cache failures should never take down storefront reads.
  }
}

export async function cacheDel(keys: string[]) {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch {
    // Best-effort invalidation.
  }
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cachedValue = await cacheGet<T>(key);
  if (cachedValue !== null) return cachedValue;

  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
