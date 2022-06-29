import type { MetaFunction } from "@remix-run/node";
import { LinksFunction } from "@remix-run/node";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ServerStyleContext, ClientStyleContext } from "./context";

import { KeyboardEvent, useContext, useEffect } from "react";
import { withEmotionCache } from "@emotion/react";
import { ChakraProvider, chakra } from "@chakra-ui/react";
import { theme } from "./chakraTheme";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    type: "image/png",
    href: "https://emojicdn.elk.sh/👨‍💻",
  },
];

export const meta: MetaFunction = () => {
  return {
    title: "Hacker News | Remix",
    charset: "utf-8",
    viewport: "width=device-width",
  };
};

function highlightFirstStoryLink(e: KeyboardEvent<HTMLBodyElement>) {
  if (e.key === "j") {
    document
      .querySelector<HTMLAnchorElement>("a[data-link-type=story]")
      ?.focus();
  }
}

interface DocumentProps {
  children: React.ReactNode;
}

const Document = withEmotionCache(
  ({ children }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext);
    const clientStyleData = useContext(ClientStyleContext);

    // Only executed on client
    useEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head;
      // re-inject tags
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      // reset cache to reapply global styles
      clientStyleData?.reset();
    }, []);

    return (
      <html lang="en">
        <head>
          <Meta />
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(" ")}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body onKeyPress={highlightFirstStoryLink}>
          {children}
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }
);

export default function App() {
  return (
    <Document>
      <ChakraProvider theme={theme}>
        <Outlet />
      </ChakraProvider>
    </Document>
  );
}
