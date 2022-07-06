import { LoaderFunction } from "@remix-run/node";

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

  // If there is no og:image, return null
  if (!ogImageUrl) {
    // return new Response(null, { status: 404 });
    const text = new URL(url).hostname;
    return fetch(
      `https://images.placeholders.dev/?width=1200&height=600&text=${text}&fontFamily=Helvetica%20Neue&fontSize=64`
    );
  }
  console.log("Accept", request.headers.get("Accept"));
  return fetch(ogImageUrl[1], {
    headers: {
      Accept: request.headers.get("Accept") || "image/*",
    },
  });
};
