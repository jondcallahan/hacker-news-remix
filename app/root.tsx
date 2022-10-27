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

import { KeyboardEvent } from "react";
import { ChakraProvider, chakra } from "@chakra-ui/react";
import { theme } from "./chakraTheme";

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
    rel: "preconnect",
    href: "https://fonts.bunny.net",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.bunny.net/css2?family=Vollkorn:ital@0;1&display=swap",
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

const Document = ({ children }: DocumentProps) => {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <chakra.body
        onKeyPress={highlightFirstStoryLink}
        display="grid"
        gridTemplateRows="auto auto 1fr auto"
        gridTemplateAreas="'nav' 'progress-bar' 'content' 'footer'"
      >
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </chakra.body>
    </html>
  );
};

export default function App() {
  return (
    <Document>
      <ChakraProvider theme={theme}>
        <Outlet />
      </ChakraProvider>
    </Document>
  );
}
