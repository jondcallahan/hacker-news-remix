import { lookup } from "node:dns/promises";
import { loadXeet } from "@xeet/core/node";
import { getTweetUrl, type TweetPreview } from "./tweet";

/** Resolve and measure before first paint; PNG rendering stays in the browser. */
export async function getTweetPreview(
  input: string,
): Promise<TweetPreview | undefined> {
  const url = getTweetUrl(input);
  if (!url) return;
  try {
    const xeet = await loadXeet({ lazy: true });
    const options = { dpr: 2, theme: "light" as const };
    const host = xeet.whatwgHost({
      lookup: async (hostname) =>
        (await lookup(hostname, { all: true })).map(({ address }) => address),
    });
    const { post } = await xeet.resolve(
      url,
      { width: 600, dpr: 2, media: true },
      host,
    );
    await xeet.ensureFonts?.({ post, options });
    return {
      post,
      layout: {
        mobile: xeet.explain(post, { ...options, width: 390 }).size.height,
        desktop: xeet.explain(post, { ...options, width: 600 }).size.height,
      },
    };
  } catch (error) {
    console.error("Error preparing tweet preview", error);
    return undefined;
  }
}
