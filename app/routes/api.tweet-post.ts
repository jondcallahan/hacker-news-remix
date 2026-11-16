import { getOrSetToCache } from "~/utils/caching.server";
import type { Post } from "@xeet/core";
import { lookup } from "node:dns/promises";
import { loadXeet } from "@xeet/core/node";
import type { LoaderFunctionArgs } from "react-router";
import { getTweetUrl } from "~/utils/tweet";

const pending = new Map<string, Promise<{ post: Post } | null>>();

async function cachedPost(url: string) {
  let request = pending.get(url);
  if (!request) {
    request = getOrSetToCache(
      `tweet-post:${url}`,
      async () => {
        const xeet = await loadXeet({ lazy: true });
        const host = xeet.whatwgHost({
          lookup: async (hostname) =>
            (await lookup(hostname, { all: true })).map(
              ({ address }) => address,
            ),
        });
        const { post } = await xeet.resolve(
          url,
          { width: 600, dpr: 2, media: true },
          host,
        );
        return { post };
      },
      3600,
    ).finally(() => pending.delete(url));
    pending.set(url, request!);
  }
  return request;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const url = getTweetUrl(searchParams.get("url") ?? "");
  if (!url) return new Response("Invalid post URL", { status: 400 });

  try {
    const result = await cachedPost(url);
    if (!result) throw new Error("Preview unavailable");
    return Response.json(result, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error resolving post preview", error);
    return new Response("Post preview unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
