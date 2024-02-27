import { trytm } from "@bdsqqq/try";
import { getOrSetToCache } from "./caching.server";
import { getRelativeTimeString } from "./time";
import { DomHandler, DomUtils, Parser } from "htmlparser2";

export type Item = {
  by: string;
  descendants: number;
  id: number;
  kids?: Item[];
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
      const itemRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      );

      if (!itemRes.ok) {
        await itemRes.text(); // Read the response body to prevent a memory leak
        return null;
      }

      const _item: Item = await itemRes.json();
      // Calculate relative time server side to prevent rendering 1 second ago on server and 2 seconds ago on client. This fixes a react hydration error.
      _item.relativeTime = getRelativeTimeString(_item.time * 1_000);

      return new Promise((resolve) => resolve(_item));
    } catch (error) {
      console.error(error);
      return null;
    }
  });

  return item;
};

export const getTopStories = async (limit: number): Promise<Item[] | null> => {
  const key = "/v0/topstories";

  return getOrSetToCache(key, async () => {
    try {
      const topStoryIdsRes = await fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
      );
      const topStoryIds = await topStoryIdsRes.json();
      return Promise.all(
        topStoryIds.slice(0, limit).map((id: number) => {
          return getItem(id.toString());
        })
      );
    } catch (error) {
      console.error(error);
      return null;
    }
  });
};

export const fetchAllKids = async (id: string) => {
  const item = await getItem(id);

  await Promise.all(
    item?.kids?.map(
      async (id: string, index: number) =>
        (item.kids[index] = await fetchAllKids(id))
    ) || []
  );

  return item;
};

export async function getOgImageUrlFromUrl(url: string) {
  const [res, error] = await trytm(fetch(url, {}));
  if (error || !res.ok) {
    console.log("Failed to fetch url", url);
    // Read the response body to prevent a memory leak
    if (res) {
      await res.text();
    }
    return null;
  }

  const text = await res.text();

  const handler = new DomHandler();
  new Parser(handler).end(text);

  const metaTags = DomUtils.findAll((el) => el.name === "meta", handler.dom);

  // Cast a wide net for og:image, any of these can be used but they are in priority order
  const imgUrls = {
    "og:image": "",
    "og:image:url": "",
    "twitter:image": "",
    "twitter:image:src": "",
  };

  metaTags.forEach((metaTag) => {
    const property = metaTag.attribs.property;
    let content = metaTag.attribs.content;

    if (property && content && imgUrls.hasOwnProperty(property)) {
      // ogImageUrl may be a relative path, if so prepend the url to get the full path
      if (!content.startsWith("http")) {
        content = new URL(content, url).href;
      }
      imgUrls[property] = content;
    }
  });

  return (
    imgUrls["og:image"] ||
    imgUrls["og:image:url"] ||
    imgUrls["twitter:image"] ||
    imgUrls["twitter:image:src"] ||
    null
  );
}
