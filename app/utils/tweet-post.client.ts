import type { Post } from "@xeet/core";
import { getTweetUrl } from "./tweet";
const requests = new Map<string, Promise<{ post: Post }>>();

export function getTweetPost(input: string): Promise<{ post: Post }> {
  const url = getTweetUrl(input);
  if (!url) return Promise.reject(new Error("Invalid tweet URL"));
  let request = requests.get(url);
  if (!request) {
    request = fetch(`/api/tweet-post?url=${encodeURIComponent(url)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Preview unavailable");
        return (await response.json()) as { post: Post };
      })
      .catch((error) => {
        requests.delete(url);
        throw error;
      });
    requests.set(url, request);
  }
  return request;
}
