import { getOrSetToCache } from "./caching.server";
import { getRelativeTimeString } from "./time";
import { Agent } from "http";
import https from "https";
import ky from "ky";

// Create HTTP agents with keep-alive enabled
const httpAgent = new Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

// Create a custom ky instance with optimal settings
const kyWithRetry = ky.extend({
  timeout: 10000, // 10 second timeout
  retry: {
    limit: 3, // Retry up to 3 times
    methods: ["get"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Apply the keep-alive agent based on protocol
        const url = new URL(request.url);
        if (url.protocol === "http:") {
          // @ts-ignore - type definition issue with ky and node's http agent
          request.agent = httpAgent;
        } else {
          // @ts-ignore - type definition issue with ky and node's https agent
          request.agent = httpsAgent;
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        // Log slow responses for performance monitoring
        if (response.headers.has("x-response-time")) {
          const time = parseInt(response.headers.get("x-response-time") || "0");
          if (time > 1000) {
            console.warn(`Slow response: ${request.url} took ${time}ms`);
          }
        }
        return response;
      },
    ],
  },
});

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
      const response = await kyWithRetry.get(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      ).json<Item>();

      // Calculate relative time server side to prevent rendering 1 second ago on server and 2 seconds ago on client
      // This fixes a react hydration error
      response.relativeTime = getRelativeTimeString(response.time * 1_000);

      return response;
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
      const topStoryIds = await kyWithRetry.get(
        "https://hacker-news.firebaseio.com/v0/topstories.json",
      ).json<number[]>();

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
    const text = await kyWithRetry.get(url, {
      timeout: 5000,
      retry: 2,
    }).text();

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
