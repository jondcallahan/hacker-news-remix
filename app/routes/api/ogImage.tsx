import { LoaderFunction } from "@remix-run/node";
import { getOrSetToCache } from "~/utils/caching.server";
import { getOGImagePlaceholderContent } from "../__layout/item/$id";

async function getOgImageUrlFromUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();

  const match = text.match(/<meta property="og:image" content="(.*?)"/);
  if (!match) return null;
  return match[1];
}

export const loader: LoaderFunction = async ({ request }) => {
  // Request will come in like /api/ogImage?url=https://remix.one
  // Get the url from the request
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response(null, { status: 400 });

  // Get the og:image from the html text
  const ogImageUrl = await getOrSetToCache(
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

  return imageRes;
};
