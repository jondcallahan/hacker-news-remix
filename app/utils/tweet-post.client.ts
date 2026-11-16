import type { Post } from "@xeet/core";
import { getTweetUrl } from "./tweet";

type TweetData = { post: Post };
type Entry = { promise: Promise<TweetData>; expires: number };
const requests = new Map<string, Entry>();
const waiting: (() => void)[] = [];
let running = 0;

// Visible cards share a small queue, so scrolling cannot start a request burst.
function schedule(work: () => Promise<TweetData>): Promise<TweetData> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      running++;
      try {
        resolve(await work());
      } catch (error) {
        reject(error);
      } finally {
        running--;
        waiting.shift()?.();
      }
    };
    if (running < 2) void run();
    else waiting.push(run);
  });
}

export function getTweetPost(input: string): Promise<TweetData> {
  const url = getTweetUrl(input);
  if (!url) return Promise.reject(new Error("Invalid tweet URL"));
  for (const [key, entry] of requests) {
    if (entry.expires <= Date.now()) requests.delete(key);
  }
  const cached = requests.get(url);
  if (cached) return cached.promise;

  const promise = schedule(async () => {
    const response = await fetch(
      `/api/tweet-post?url=${encodeURIComponent(url)}`,
    );
    if (!response.ok) throw new Error("Preview unavailable");
    return (await response.json()) as TweetData;
  });
  const entry = { promise, expires: Infinity };
  requests.set(url, entry);
  promise.then(
    () => {
      entry.expires = Date.now() + 3600_000;
    },
    () => {
      entry.expires = Date.now() + 30_000;
    },
  );
  return promise;
}
