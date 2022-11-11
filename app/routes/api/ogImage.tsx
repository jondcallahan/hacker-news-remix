import { LoaderFunction } from "@remix-run/node";
import { getPlaiceholder } from "plaiceholder";
import { getOrSetToCache } from "~/utils/caching.server";
import { getOGImagePlaceholderContent } from "../__layout/item/$id";
import { Window } from "happy-dom";
import satori from "satori";
import { formatDate } from "~/utils/time";

function getFontBlobs() {
  return [
    fetch("https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff"),
    fetch("https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff"),
  ];
}

async function getTweetCard({
  text,
  handle,
  likeCount,
  retweetCount,
  publishedAt,
  hasImage,
}: {
  text: string;
  handle: string;
  likeCount: number;
  retweetCount: number;
  publishedAt: string;
  hasImage: boolean;
}) {
  const [inter400, inter700] = await Promise.all(getFontBlobs());

  const friendlyDate = formatDate(new Date(publishedAt));
  const friendlyText = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  const formatNumber = (num: number) => {
    if (num > 999) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num;
  };

  const svg = await satori(
    <div tw="flex flex-col p-8 h-full w-full justify-center bg-stone-50">
      <h2 tw="text-3xl font-bold tracking-tight leading-snug text-gray-900">
        {friendlyText}
      </h2>
      {hasImage && (
        <p tw="flex items-top">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            tw="w-4 h-4 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span tw="text-slate-600 text-sm">Photo attached</span>
        </p>
      )}
      <p tw="text-xl font-bold flex items-center">
        <span tw="text-sky-600 mr-4">{handle}</span>
        <span tw="mr-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="#dc2626"
            tw="w-5 h-5 mr-1"
          >
            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
          </svg>
          {formatNumber(likeCount)}
        </span>
        <span tw="mr-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="#059669"
            tw="w-5 h-5 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M10 4.5c1.215 0 2.417.055 3.604.162a.68.68 0 01.615.597c.124 1.038.208 2.088.25 3.15l-1.689-1.69a.75.75 0 00-1.06 1.061l2.999 3a.75.75 0 001.06 0l3.001-3a.75.75 0 10-1.06-1.06l-1.748 1.747a41.31 41.31 0 00-.264-3.386 2.18 2.18 0 00-1.97-1.913 41.512 41.512 0 00-7.477 0 2.18 2.18 0 00-1.969 1.913 41.16 41.16 0 00-.16 1.61.75.75 0 101.495.12c.041-.52.093-1.038.154-1.552a.68.68 0 01.615-.597A40.012 40.012 0 0110 4.5zM5.281 9.22a.75.75 0 00-1.06 0l-3.001 3a.75.75 0 101.06 1.06l1.748-1.747c.042 1.141.13 2.27.264 3.386a2.18 2.18 0 001.97 1.913 41.533 41.533 0 007.477 0 2.18 2.18 0 001.969-1.913c.064-.534.117-1.071.16-1.61a.75.75 0 10-1.495-.12c-.041.52-.093 1.037-.154 1.552a.68.68 0 01-.615.597 40.013 40.013 0 01-7.208 0 .68.68 0 01-.615-.597 39.785 39.785 0 01-.25-3.15l1.689 1.69a.75.75 0 001.06-1.061l-2.999-3z"
              clipRule="evenodd"
            />
          </svg>
          {formatNumber(retweetCount)}
        </span>
      </p>
      <p tw="flex items-top">
        <span>
          <svg viewBox="0 0 20 20" tw="h-4 w-4 mr-1" fill="#0284c7">
            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.615 11.615 0 006.29 1.84" />
          </svg>
        </span>
        <span>{friendlyDate}</span>
      </p>
    </div>,
    {
      fonts: [
        {
          name: "Inter",
          data: await inter400.arrayBuffer(),
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: await inter700.arrayBuffer(),
          weight: 700,
          style: "normal",
        },
      ],
      width: 800,
      height: 400,
    }
  );

  return svg;
}

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

async function getTweetDetails(url: string) {
  if (!process.env.PEEKALINK_API_KEY) {
    console.log("No API key found");
    return null;
  }

  const data = await getOrSetToCache(
    `tweet:${url}`,
    async () => {
      const res = await fetch(`https://api.peekalink.io/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.PEEKALINK_API_KEY as string, // Cast to string since we're checking for it above
        },
        body: JSON.stringify({
          link: url,
        }),
      });

      if (!res.ok) {
        console.log("Failed to fetch tweet", url);
        console.log("Status", res.status);
        return null;
      }

      const json = await res.json();

      return json;
    },
    60 * 5
  );

  if (!data) return null;

  return {
    handle: data.name,
    text: data.description,
    retweetCount: data.details.retweetCount,
    likeCount: data.details.likesCount,
    publishedAt: data.details.publishedAt,
    hasImage: !!data.image,
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  // Request will come in like /api/ogImage?url=https://remix.run
  // Get the url from the request
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response(null, { status: 400 });

  if (url.startsWith("https://twitter.com")) {
    const tweetDetails = await getTweetDetails(url);

    if (tweetDetails) {
      try {
        return new Response(await getTweetCard(tweetDetails), {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=" + 60 * 60 * 24,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

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
    await getOrSetToCache(
      `ogimage:placeholder:${url}`,
      async () => {
        try {
          // We need to clone the response because we need to read the body twice
          const imageResClone = imageRes.clone();

          // Get the image buffer
          const buffer = Buffer.from(await imageResClone.arrayBuffer());

          return getPlaiceholder(buffer);
        } catch (error) {
          console.error("error", error);
        }
      },
      60 * 60 * 24
    );
  }

  return imageRes;
};
