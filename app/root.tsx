import type { LinksFunction, MetaFunction } from "react-router";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { type KeyboardEvent } from "react";
import { ChakraProvider, chakra } from "@chakra-ui/react";
import { Analytics } from "@vercel/analytics/react";
import { theme } from "./chakraTheme";

import "@fontsource/vollkorn/latin.css";
import "@fontsource/vollkorn/400-italic.css";
import "@fontsource-variable/inter";
import "./styles.css";

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
];

export const meta: MetaFunction = () => {
  return [
    {
      title: "Hacker News",
    },
    {
      property: "og:site_name",
      content: "Jon's Hacker News Reader",
    },
  ];
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
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
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
        <ScrollRestoration getKey={(location) => location.pathname} />
        <Scripts />
        <Analytics />
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
