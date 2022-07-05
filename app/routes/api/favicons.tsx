import { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async ({ request }) => {
  // Request will come in like /api/favicons?url=https://remix.one

  // Get the url from the request
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  // If there is no url, return null
  if (!url) return null;

  // Get the logo from the url
  const logo = await fetch(`https://icons.duckduckgo.com/ip3/${url}.ico`);

  // If there is no logo, return null
  if (!logo) return null;

  // If there is a logo, return it as a png
  return new Response(logo.body, {
    headers: logo.headers,
  });
};
