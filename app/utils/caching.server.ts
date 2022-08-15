import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL as string);
const DEFAULT_CACHE_TTL = 60; // 1 minute

// This function returns the value that getter function returns.
export async function getOrSetToCache(
  key: string,
  getter: () => Promise<any>,
  ttl: number = DEFAULT_CACHE_TTL
) {
  const cachedValue = await redis.get(key);
  if (cachedValue) {
    return JSON.parse(cachedValue);
  }

  const value = await getter();
  if (value) {
    // Only set the cache if the value is not null
    const serializedValue = JSON.stringify(value);
    await redis.setex(key, ttl, serializedValue);
    return value;
  }

  return null;
}
