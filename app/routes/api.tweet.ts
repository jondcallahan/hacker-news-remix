import { lookup } from "node:dns/promises";
import { loadXeet } from "@xeet/core/node";
import type { LoaderFunctionArgs } from "react-router";
import { getTweetUrl } from "~/utils/tweet";

export async function loader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const url = getTweetUrl(searchParams.get("url") ?? "");
  if (!url) return new Response("Invalid post URL", { status: 400 });

  try {
    const xeet = await loadXeet({ lazy: true });
    const options = {
      width: searchParams.get("width") === "390" ? 390 : 600,
      dpr: 2,
      theme: "light" as const,
    };
    const host = xeet.whatwgHost({
      // Let the resolver reject private DNS destinations for links and media.
      lookup: async (hostname) =>
        (await lookup(hostname, { all: true })).map(({ address }) => address),
    });
    const { post } = await xeet.resolve(url, { ...options, media: true }, host);
    await xeet.ensureFonts?.({ post, options });
    const { png } = xeet.render(post, options);

    return new Response(Buffer.from(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error rendering post preview", error);
    return new Response("Post preview unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
