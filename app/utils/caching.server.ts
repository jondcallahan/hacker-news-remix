import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL as string);
const DEFAULT_CACHE_TTL = 60; // 1 minute

export async function getOrSetToCache(
  key: string,
  getter: () => Promise<any>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<any> {
  const cachedValue = await redis.get(key);
  if (cachedValue) {
    return JSON.parse(cachedValue);
  }

  const value = await getter();
  await redis.setex(key, ttl, JSON.stringify(value));

  return value;
}
