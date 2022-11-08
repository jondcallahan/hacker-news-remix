import { LoaderFunction } from "@remix-run/node";
import { getPlaiceholder } from "plaiceholder";
import { getOrSetToCache } from "~/utils/caching.server";
import { getOGImagePlaceholderContent } from "../__layout/item/$id";
import { Window } from "happy-dom";

async function getOgImageUrlFromUrl(url: string) {
  const res = await fetch(url, {});
  if (!res.ok) {
    console.log("Failed to fetch url", url);
    return null;
  }

  const text = await res.text();

  const window = new Window();
  const document = window.document;
  document.body.innerHTML = text;

  const metaTags = document.getElementsByTagName("meta");

  // Cast a wide net for og:image, any of these can be used but they are in priority order
  const imgUrls = {
    "og:image": "",
    "og:image:url": "",
    "twitter:image": "",
    "twitter:image:src": "",
  };

  Array.from(metaTags).forEach((metaTag) => {
    switch (metaTag.getAttribute("property")) {
      case "og:image":
        imgUrls["og:image"] = metaTag.getAttribute("content");
        break;
      case "og:image:url":
        imgUrls["og:image:url"] = metaTag.getAttribute("content");
        break;
      case "twitter:image":
        imgUrls["twitter:image"] = metaTag.getAttribute("content");
        break;
      case "twitter:image:src":
        imgUrls["twitter:image:src"] = metaTag.getAttribute("content");
        break;
    }
  });

  if (imgUrls["og:image"]) return imgUrls["og:image"];
  if (imgUrls["og:image:url"]) return imgUrls["og:image:url"];
  if (imgUrls["twitter:image"]) return imgUrls["twitter:image"];
  if (imgUrls["twitter:image:src"]) return imgUrls["twitter:image:src"];

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
