// entry.server.tsx
import { renderToString } from "react-dom/server";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import { RemixServer } from "@remix-run/react";
import type { EntryContext } from "@remix-run/node"; // Depends on the runtime you choose

import { ServerStyleContext } from "./context";
import createEmotionCache from "./createEmotionCache";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // This is a hack to store the users time zone in a cookie
  // so that when we server render the page, we can format the dates
  // with the correct time zone. This avoids the "flicker" of the
  // dates changing when the client side app loads.
  if (!request.headers.get("cookie")?.includes("time_zone")) {
    const script = `
      document.cookie = 'time_zone=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '; path=/';
      window.location.reload();
    `;
    return new Response(
      `<html><body><script>${script}</script></body></html>`,
      {
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "time_zone='America/Los_Angeles'; path=/",
          Refresh: `0; url=${request.url}`,
        },
      }
    );
  }

  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  const html = renderToString(
    <ServerStyleContext.Provider value={null}>
      <CacheProvider value={cache}>
        <RemixServer context={remixContext} url={request.url} />
      </CacheProvider>
    </ServerStyleContext.Provider>
  );

  const chunks = extractCriticalToChunks(html);

  const markup = renderToString(
    <ServerStyleContext.Provider value={chunks.styles}>
      <CacheProvider value={cache}>
        <RemixServer context={remixContext} url={request.url} />
      </CacheProvider>
    </ServerStyleContext.Provider>
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
