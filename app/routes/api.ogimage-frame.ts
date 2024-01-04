import { LoaderFunction } from "@remix-run/node";
import { getOgImageUrlFromUrl } from "~/utils/api.server";
import { getOrSetToCache } from "~/utils/caching.server";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";
// import { getOgImageUrlFromUrl } from "./api/ogImage";

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

  // If we couldn't find an og:image, return a default image
  if (!ogImageUrl) {
    ogImageUrl = `data:image/svg+xml;base64,${btoa(
      getOGImagePlaceholderContent(new URL(url).hostname)
    )}`;
  }

  // Return an html string that gets iframe'd into the $id page via HeroImage component
  return new Response(
    `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
    </head>
    <body style="margin:0;padding:0;">
      <div style="min-height:100cqh;height:100%;width:100%;background-image:url(${ogImageUrl});background-size:cover;background-position:center;"></div>
    </body>
    </html>
    `,
    {
      headers: {
        "content-type": "text/html",
      },
    }
  );
};
