import {
  Links,
  LinksFunction,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "remix";
import type { MetaFunction } from "remix";
import stylesUrl from "./styles/global.css";
import { KeyboardEvent } from "react";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    type: "image/png",
    href: "https://emojicdn.elk.sh/👨‍💻",
  },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/open-props/normalize.min.css",
  },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/open-props",
  },
  {
    rel: "stylesheet",
    href: stylesUrl,
  },
];

export const meta: MetaFunction = () => {
  return { title: "Hacker News | Remix" };
};

function highlightFirstStoryLink(e: KeyboardEvent<HTMLBodyElement>) {
  if (e.key === "j") {
    document.querySelector("article a[data-link-type=story]")?.focus?.();
  }
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body onKeyPress={highlightFirstStoryLink}>
        <nav>
          <section>
            <h5>
              <NavLink to={"/"}>Home</NavLink>
            </h5>
          </section>
        </nav>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
