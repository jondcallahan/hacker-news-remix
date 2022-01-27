import { FirebaseApp, initializeApp } from "firebase/app";
import {
  child,
  get,
  getDatabase,
  limitToFirst,
  query,
  ref,
} from "firebase/database";

export const createApp = (): FirebaseApp => {
  let app;
  // this piece of code may run multiple times in development mode,
  // so we attach the instantiated API to `process` to avoid duplications
  if (process.__FIREBASE_APP) {
    app = process.__FIREBASE_APP;
  } else {
    app = initializeApp({ databaseURL: "https://hacker-news.firebaseio.com" });
    process.__FIREBASE_APP = app;
  }
  return app;
};

export const getItem = async (id: number) => {
  const dbRef = ref(getDatabase(createApp()));

  return get(child(dbRef, `v0/item/${id}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log("No data available");
        return null;
      }
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
};

export const getTopStories = async (limit: number) => {
  const dbRef = ref(getDatabase(createApp()));

  return get(query(child(dbRef, "/v0/topstories"), limitToFirst(limit)))
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log("No data available");
        return null;
      }
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
};