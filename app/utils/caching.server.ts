import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL as string);
const DEFAULT_CACHE_TTL = 60; // 1 minute

/* This function returns the value that getter function returns.
 * If the value is not in the cache, it will call the getter function
 * and store the value in the cache.
 * Default TTL of 1 minute is used if no TTL is provided.
 */
export async function getOrSetToCache(
  key: string,
  getter: () => Promise<any>,
  ttl: number = DEFAULT_CACHE_TTL
) {
  const cachedValue = await redis.get(key);
  if (cachedValue) {
    return JSON.parse(cachedValue);
  }

  let value: any;

  try {
    value = await getter();
  } catch (error) {
    console.error("Error calling getter for key: ", key, error);
  }

  if (value) {
    // Only set the cache if the value is not null
    const serializedValue = JSON.stringify(value);
    await redis.setex(key, ttl, serializedValue);
    return value;
  }

  return null;
}

export async function getFromCache(key: string) {
  const cachedValue = await redis.get(key);
  if (cachedValue) {
    return JSON.parse(cachedValue);
  }
  return null;
}
