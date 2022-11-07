import { LoaderFunction } from "@remix-run/node";
import { getPlaiceholder } from "plaiceholder";
import { getOrSetToCache } from "~/utils/caching.server";
import { getOGImagePlaceholderContent } from "../__layout/item/$id";

async function getOgImageUrlFromUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();

  // Get the image from the open graph meta tag
  // Meta tag may be in the form of <meta property="og:image" content="https://remix.run/og-image.png">
  // or <meta content="https://remix.run/og-image.png" property="og:image" />
  // or <meta data-rh="true" property="og:image" content="https://remix.run/og-image.png" />
  // so we need to match all of these
  const match = text.match(/<meta.*?property="og:image".*?content="(.*?)"/);

  if (match?.[1]) return match[1];
  return null;
}

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
    60 * 60 * 24 // Cache OG Image for 1 day
  );

  // If there is no og:image, return the placeholder image
  if (!ogImageUrl) {
    const text = new URL(url).hostname;
    return new Response(getOGImagePlaceholderContent(text), {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=" + 60 * 60 * 24,
      },
    });
  }

  // ogImageUrl may be a relative path, if so prepend the url to get the full path
  if (!ogImageUrl.startsWith("http")) {
    ogImageUrl = new URL(ogImageUrl, url).href;
  }

  const imageRes = await fetch(ogImageUrl, {
    headers: {
      Accept: request.headers.get("Accept") || "image/*",
      "If-None-Match": request.headers.get("If-none-match") || "",
    },
  });

  imageRes.headers.delete("set-cookie");

  if (!imageRes.headers.get("cache-control")) {
    imageRes.headers.set("cache-control", "public, max-age=" + 60 * 60 * 24);
  }

  if (imageRes.status === 200) {
    // Use getOrSetToCache to avoid computing the image placeholder if it's already in the cache
    getOrSetToCache(
      `ogimage:placeholder:${url}`,
      async () => {
        // TODO: Under the hood this will refetch the image, we should be able to use the imageRes from above
        const plaiceholder = await getPlaiceholder(ogImageUrl);
        return plaiceholder;
      },
      60 * 60 * 24
    );
  }

  return imageRes;
};
