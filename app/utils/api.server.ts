// import { FirebaseApp, initializeApp } from "firebase/app";
// import {
//   child,
//   get,
//   limitToFirst,
//   query,
//   ref,
//   getDatabase,
// } from "firebase/database";
import { getOrSetToCache } from "./caching.server";

// const createApp = (): FirebaseApp => {
//   let app = process.__FIREBASE_APP;
//   // this piece of code may run multiple times in development mode,
//   // so we attach the instantiated API to `process` to avoid duplications
//   if (app) {
//     return app;
//   } else {
//     app = initializeApp({ databaseURL: "https://hacker-news.firebaseio.com" });
//     process.__FIREBASE_APP = app;
//     console.log("Firebase app created");
//     return app;
//   }
// };

export type Item = {
  by: string;
  descendants: number;
  id: number;
  kids?: Item[];
  score: number;
  time: number;
  title: string;
  type: string;
  url?: string;
  text?: string;
  dead?: boolean;
  deleted?: boolean;
};

export const getItem = async (id: string): Promise<Item | null> => {
  const item = await getOrSetToCache(`item:${id}`, async () => {
    // try {
    //   const dbRef = ref(getDatabase(createApp()));
    //   const snapshot = await get(child(dbRef, `v0/item/${id}`));

    //   if (snapshot.exists()) {
    //     return snapshot.val();
    //   } else {
    //     console.log(`Error getting item ${id} No data available`);
    //     return null;
    //   }
    // } catch (error) {
    //   console.error(error);
    //   return null;
    // }
    try {
      const itemRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
      );
      return itemRes.json();
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
    // const dbRef = ref(getDatabase(createApp()));
    // return get(query(child(dbRef, "/v0/topstories"), limitToFirst(limit)))
    //   .then((snapshot) => {
    //     if (snapshot.exists()) {
    //       const topStoryIds: number[] = snapshot.val();
    //       return Promise.all(
    //         topStoryIds.map(async (id) => {
    //           return getItem(id.toString());
    //         })
    //       );

    //       // return topStoryIds;
    //     } else {
    //       console.log(`Error getting top stories No data available`);
    //       return null;
    //     }
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //     return null;
    //   });
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
