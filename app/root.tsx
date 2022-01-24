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
import stylesUrl from "./styles/main.css";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍💻</text></svg>`,
  },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/open-props",
  },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/open-props/normalize.min.css",
  },
  {
    rel: "stylesheet",
    href: stylesUrl,
  },
];

export const meta: MetaFunction = () => {
  return { title: "Hacker News | Remix" };
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav>
          <div>
            <h5>
              <NavLink to={"/"}>Home</NavLink>
            </h5>
          </div>
        </nav>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
