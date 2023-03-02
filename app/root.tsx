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
import VollkornStyles from "@fontsource/vollkorn/latin.css";
import VollkornItalicStyles from "@fontsource/vollkorn/400-italic.css";
import InterStyles from "@fontsource/inter/variable.css";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    type: "image/png",
    href: "/favicon.png",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍💻</text></svg>",
  },
  {
    rel: "stylesheet",
    href: VollkornStyles,
  },
  {
    rel: "stylesheet",
    href: VollkornItalicStyles,
  },
  {
    rel: "stylesheet",
    href: InterStyles,
  },
];

export const meta: MetaFunction = () => {
  return {
    title: "Hacker News",
    charset: "utf-8",
    viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
    "og:site_name": "Jon's Hacker News Reader",
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
        <chakra.body
          onKeyPress={highlightFirstStoryLink}
          display="grid"
          gridTemplateRows="auto auto 1fr auto"
          gridTemplateAreas="'nav' 'progress-bar' 'content' 'footer'"
        >
          {children}
          <ScrollRestoration getKey={(location) => location.pathname} />
          <Scripts />
          <LiveReload />
        </chakra.body>
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
