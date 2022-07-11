import { LoaderFunction } from "@remix-run/node";
import { getOGImagePlaceholderContent } from "../__layout/item/$id";

export const loader: LoaderFunction = async ({ request }) => {
  // Request will come in like /api/ogImage?url=https://remix.one
  // Get the url from the request
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response(null, { status: 400 });

  // Get the og:image from the url
  const res = await fetch(url);

  // If there is no og:image, return null
  if (!res) return new Response(null, { status: 404 });

  // Get the html text from the url
  const text = await res.text();

  // Get the og:image from the html text
  const ogImageUrl = text.match(/<meta property="og:image" content="(.*?)"/);

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

  const imageRes = await fetch(ogImageUrl[1], {
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
