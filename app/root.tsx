import {
  Links,
  LinksFunction,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useTransition,
} from "remix";
import type { MetaFunction } from "remix";
import normalizeStyles from "node_modules/open-props/normalize.min.css";
import openPropsStyles from "node_modules/open-props/open-props.min.css";
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
    href: normalizeStyles,
  },
  {
    rel: "stylesheet",
    href: openPropsStyles,
  },
  {
    rel: "stylesheet",
    href: stylesUrl,
  },
];

export const meta: MetaFunction = () => {
  return { title: "Hacker News | Remix", charset: "utf-8" };
};

function highlightFirstStoryLink(e: KeyboardEvent<HTMLBodyElement>) {
  if (e.key === "j") {
    document.querySelector("article a[data-link-type=story]")?.focus?.();
  }
}

export default function App() {
  const matches = useMatches();
  const transition = useTransition();
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
              {matches.map(({ data, handle }) => {
                if (handle?.showBreadcrumb) {
                  return (
                    <span key={data.story.id}>
                      {" "}
                      /{" "}
                      <a href={data.story.url} target="_blank">
                        {data.story.title}{" "}
                        {!!data.story.url && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            height={20}
                            width={20}
                            fill="currentColor"
                          >
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        )}
                      </a>
                    </span>
                  );
                }
              })}
            </h5>
          </section>
        </nav>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="loading-spinner"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          data-loading={transition?.state === "loading"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
