import { getOrSetToCache } from "./caching.server";
import { getRelativeTimeString } from "./time";

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
