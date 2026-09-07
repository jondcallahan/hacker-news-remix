import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
// React 19 resolves react-dom/server to the Web Streams API under Bun.
// This handler uses Node streams, so select that entry point explicitly.
import { renderToPipeableStream } from "react-dom/server.node";

const ABORT_DELAY = 5000;

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) =>
  isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
export default handleRequest;

const handleBotRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) =>
  new Promise((resolve, reject) => {
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={remixContext} url={request.url} />,
      {
        onAllReady: () => {
          const reactBody = new PassThrough();
          const stream = createReadableStreamFromReadable(reactBody);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(reactBody);
        },
        onShellError: (error: unknown) => {
          reject(error);
        },
        onError: (error: unknown) => {
          didError = true;

          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });

const handleBrowserRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) =>
  new Promise((resolve, reject) => {
    // This is a hack to store the users time zone in a cookie
    // so that when we server render the page, we can format the dates
    // with the correct time zone. This avoids the "flicker" of the
    // dates changing when the client side app loads.
    if (!request.headers.get("cookie")?.includes("time_zone")) {
      const script = `
          document.cookie = 'time_zone=' + (Intl.DateTimeFormat().resolvedOptions().timeZone) + '; path=/';
          window.location.reload();
        `;
      return resolve(
        new Response(`<html><body><script>${script}</script></body></html>`, {
          headers: {
            "Content-Type": "text/html",
            "Set-Cookie": "time_zone='America/Los_Angeles'; path=/",
            Refresh: `0; url=${request.url}`,
          },
        })
      );
    }

    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={remixContext} url={request.url} />,
      {
        onShellReady: () => {
          const reactBody = new PassThrough();
          const stream = createReadableStreamFromReadable(reactBody);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            })
          );

          pipe(reactBody);
        },
        onShellError: (error: unknown) => {
          reject(error);
        },
        onError: (error: unknown) => {
          didError = true;

          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
