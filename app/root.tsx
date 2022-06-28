import {
  json,
  Links,
  LinksFunction,
  LiveReload,
  LoaderFunction,
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
  return {
    title: "Hacker News | Remix",
    charset: "utf-8",
    viewport: "width=device-width,initial-scale=1",
  };
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
    <html lang="en" data-theme="light">
      <head>
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
          {/* Moon icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="theme-toggle dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            onClick={() => {
              document
                .querySelector("html")
                ?.setAttribute("data-theme", "dark");
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          {/* Sun icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="theme-toggle light"
            onClick={() => {
              document
                .querySelector("html")
                ?.setAttribute("data-theme", "light");
            }}
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            className="theme-toggle light"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="theme-toggle light"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            onClick={() => {
              document
                .querySelector("html")
                ?.setAttribute("data-theme", "light");
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg> */}
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
