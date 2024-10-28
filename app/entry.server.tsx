import { renderToString } from "react-dom/server";
import createEmotionCache from "@emotion/cache";
import { CacheProvider as EmotionCacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import isbot from "isbot";

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) =>
  isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixContext,
    )
    : handleBrowserRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixContext,
    );

const handleBotRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) => {
  const emotionCache = createEmotionCache({ key: "css" });
  const emotionServer = createEmotionServer(emotionCache);

  const markup = renderToString(
    <EmotionCacheProvider value={emotionCache}>
      <RemixServer context={remixContext} url={request.url} />
    </EmotionCacheProvider>,
  );

  const { css } = emotionServer.extractCritical(markup);
  const html = `<!DOCTYPE html>${markup}`;
  const styles = `<style>${css}</style>`;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(`${html}${styles}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
};

const handleBrowserRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) => {
  // Timezone check
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
      },
    );
  }

  const emotionCache = createEmotionCache({ key: "css" });
  const emotionServer = createEmotionServer(emotionCache);

  const markup = renderToString(
    <EmotionCacheProvider value={emotionCache}>
      <RemixServer context={remixContext} url={request.url} />
    </EmotionCacheProvider>,
  );

  const { css } = emotionServer.extractCritical(markup);
  const html = `<!DOCTYPE html>${markup}`;
  const styles = `<style>${css}</style>`;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(`${html}${styles}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
};

export default handleRequest;
