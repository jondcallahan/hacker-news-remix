import type { LoaderFunctionArgs } from "react-router";
import { getPlaiceholder } from "plaiceholder";
import { getOrSetToCache } from "~/utils/caching.server";
import { trytm } from "@bdsqqq/try";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";
import { getOgImageUrlFromUrl } from "~/utils/api.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response(null, { status: 400 });

  // Extract and cache og:image URL (1 day TTL)
  let ogImageUrl = await getOrSetToCache(
    `ogimage:${url}`,
    async () => {
      return getOgImageUrlFromUrl(url);
    },
    60 * 60 * 24
  );

  const text = new URL(url).hostname;
  const placeholderImageRes = new Response(getOGImagePlaceholderContent(text), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=" + 60 * 60 * 24,
    },
  });

  if (!ogImageUrl) {
    return placeholderImageRes;
  }

  // Fetch and proxy the og:image (getOgImageUrlFromUrl returns absolute URLs)
  const [imageRes, error] = await trytm(
    fetch(ogImageUrl, {
      headers: {
        Accept: request.headers.get("Accept") || "image/*",
        "If-None-Match": request.headers.get("If-none-match") || "",
      },
    })
  );

  if (error) {
    console.log("Error fetching og:image", error);
    return placeholderImageRes;
  }

  imageRes.headers.delete("set-cookie");

  if (!imageRes.headers.get("cache-control")) {
    imageRes.headers.set("cache-control", "public, max-age=" + 60 * 60 * 24);
  }

  if (imageRes.status === 200) {
    await getOrSetToCache(
      // Use getOrSetToCache to avoid computing the image placeholder if it's already in the cache
      `ogimage:placeholder:${url}`,
      async () => {
        try {
          // We need to clone the response because we need to read the body twice
          const imageResClone = imageRes.clone();

          // Get the image buffer
          const buffer = Buffer.from(await imageResClone.arrayBuffer());

          // This will fail if the image is an avif, but the filesize savings are worth not having a placeholder -- the image _should_ download quick enough
          // Bug in dependency of plaiceholder causing failure: https://github.com/image-size/image-size/issues/125
          return await getPlaiceholder(buffer);
        } catch (error) {
          console.error("Error getting placeholder", error);
          return null;
        }
      },
      60 * 60 * 24
    );
  } else {
    // read the response body to prevent a memory leak
    await imageRes.text();
  }

  return imageRes;
}
