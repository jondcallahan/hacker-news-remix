import { getOrSetToCache } from "./caching.server";
import { getRelativeTimeString } from "./time";

// Fetch with retry logic using Bun's native fetch
// Bun's fetch has built-in connection pooling and keep-alive by default
async function fetchWithRetry(
  url: string,
  options: RequestInit & {
    retry?: number;
    retryDelay?: number;
    timeout?: number;
  } = {}
) {
  const {
    retry = 3,
    retryDelay = 300,
    timeout = 10000,
    ...fetchOptions
  } = options;

  for (let i = 0; i <= retry; i++) {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(timeout),
      });

      // Log slow responses for performance monitoring
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) {
        console.warn(`Slow response: ${url} took ${responseTime}ms`);
      }

      // Return if successful or last retry
      if (response.ok || i === retry) {
        return response;
      }

      // Retry on specific status codes (408, 413, 429, 500, 502, 503, 504)
      if ([408, 413, 429, 500, 502, 503, 504].includes(response.status)) {
        await Bun.sleep(retryDelay * Math.min(i + 1, 3)); // Exponential backoff with cap
        continue;
      }

      return response;
    } catch (error) {
      if (i === retry) throw error;
      await Bun.sleep(retryDelay * Math.min(i + 1, 3));
    }
  }

  throw new Error("Max retries reached");
}

export type Item = {
  by: string;
  descendants: number;
  id: number;
  kids?: number[] | Item[]; // Could be IDs or loaded items
  score: number;
  time: number;
  relativeTime?: string;
  title: string;
  type: string;
  url?: string;
  text?: string;
  dead?: boolean;
  deleted?: boolean;
};

export const getItem = async (id: string): Promise<Item | null> => {
  const item = await getOrSetToCache(`item:${id}`, async () => {
    try {
      const response = await fetchWithRetry(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );

      const data = await response.json() as Item;

      // Calculate relative time server side to prevent rendering 1 second ago on server and 2 seconds ago on client
      // This fixes a react hydration error
      data.relativeTime = getRelativeTimeString(data.time * 1_000);

      return data;
    } catch (error) {
      console.error(`Failed to fetch item ${id}:`, error);
      return null;
    }
  });

  return item;
};

export const getTopStories = async (limit: number): Promise<Item[] | null> => {
  const key = "/v0/topstories";

  return getOrSetToCache(key, async () => {
    try {
      const response = await fetchWithRetry(
        "https://hacker-news.firebaseio.com/v0/topstories.json",
      );

      const topStoryIds = await response.json() as number[];

      return Promise.all(
        topStoryIds.slice(0, limit).map((id: number) => {
          return getItem(id.toString());
        }),
      );
    } catch (error) {
      console.error("Failed to fetch top stories:", error);
      return null;
    }
  });
};

// Recursively fetch all comments for a story (might be slow for large stories)
export const fetchAllKids = async (id: string) => {
  const item = await getItem(id);

  if (!item || !item.kids || item.kids.length === 0) {
    return item;
  }

  // Convert to array of IDs if needed
  const kidIds = item.kids.map((kid) => typeof kid === "number" ? kid : kid.id);

  // Fetch all comments in parallel without limiting the number
  const fetchedKids = await Promise.all(
    kidIds.map(async (kidId) => {
      // Recursively fetch each comment and its children
      return fetchAllKids(kidId.toString());
    }),
  );

  // Update the item with fetched comments
  item.kids = fetchedKids.filter(Boolean) as Item[];

  return item;
};

export async function getOgImageUrlFromUrl(url: string) {
  try {
    const response = await fetchWithRetry(url, {
      timeout: 5000,
      retry: 2,
    });

    const text = await response.text();

    // Cast a wide net for og:image, any of these can be used but they are in priority order
    const imgUrls: Record<string, string> = {
      "og:image": "",
      "og:image:url": "",
      "twitter:image": "",
      "twitter:image:src": "",
    };

    // Use Bun's native HTMLRewriter to extract meta tags
    const rewriter = new HTMLRewriter().on('meta[property], meta[name]', {
      element(el) {
        const property = el.getAttribute('property') || el.getAttribute('name');
        let content = el.getAttribute('content');

        if (property && content && property in imgUrls) {
          // ogImageUrl may be a relative path, if so prepend the url to get the full path
          if (!content.startsWith('http')) {
            content = new URL(content, url).href;
          }
          imgUrls[property] = content;
        }
      },
    });

    // Transform the HTML to extract the data
    rewriter.transform(text);

    return (
      imgUrls["og:image"] ||
      imgUrls["og:image:url"] ||
      imgUrls["twitter:image"] ||
      imgUrls["twitter:image:src"] ||
      null
    );
  } catch (error) {
    console.error(`Failed to fetch OG image from ${url}:`, error);
    return null;
  }
}
