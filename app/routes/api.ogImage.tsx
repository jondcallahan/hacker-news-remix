import { LoaderFunction } from "@remix-run/server-runtime";
import { getPlaiceholder } from "plaiceholder";
import { getOrSetToCache } from "~/utils/caching.server.ts";
import { trytm } from "@bdsqqq/try";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent.tsx";
import { getOgImageUrlFromUrl } from "~/utils/api.server.ts";

export const loader: LoaderFunction = async ({ request }) => {
  // Request will come in like /api/ogImage?url=https://remix.run
  // Get the url from the request
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response(null, { status: 400 });

  // Get the og:image from the html text
  let ogImageUrl = await getOrSetToCache(
    `ogimage:${url}`,
    async () => {
      return getOgImageUrlFromUrl(url);
    },
    60 * 60 * 24, // Cache OG Image for 1 day
  );

  const text = new URL(url).hostname;
  const placeholderImageRes = new Response(getOGImagePlaceholderContent(text), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=" + 60 * 60 * 24,
    },
  });

  // If there is no og:image, return the placeholder image
  if (!ogImageUrl) {
    return placeholderImageRes;
  }

  // ogImageUrl may be a relative path, if so prepend the url to get the full path
  if (!ogImageUrl.startsWith("http")) {
    ogImageUrl = new URL(ogImageUrl, url).href;
  }

  const [imageRes, error] = await trytm(
    fetch(ogImageUrl, {
      headers: {
        Accept: request.headers.get("Accept") || "image/*",
        "If-None-Match": request.headers.get("If-none-match") || "",
      },
    }),
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
      60 * 60 * 24,
    );
  } else {
    // read the response body to prevent a memory leak
    await imageRes.text();
  }

  return imageRes;
};
