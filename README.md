# Hacker News reader

Built with React Router, Bun, and Redis. Story data comes from the public Hacker
News API; Redis caches responses for one minute.

## Local development

Install Bun (the project targets 1.3.1) and Redis. On macOS, install Redis with
`brew install redis`.

```sh
bun install --frozen-lockfile
cp .env.example .env
```

Start Redis in a separate terminal. This local cache is bound to localhost and
does not persist data to disk:

```sh
redis-server --bind 127.0.0.1 --port 6379 --save '' --appendonly no
```

Then start the app:

```sh
bun run dev
```

Open http://localhost:3000. Internet access is required to fetch stories and images.
The `.env` file sets `KV_URL=redis://127.0.0.1:6379`; change it if Redis runs
elsewhere. Stop either foreground process with Ctrl+C.

## Checks and production build

```sh
bun run typecheck
bun run build
bun run start
```

The production server also requires Redis and `KV_URL`.

## Styling

The UI uses Tailwind CSS 4 and local React components in `app/components`.
`app/styles.css` contains the original reader's colors, font stacks, shadows,
and responsive breakpoints; `ui.tsx` provides the shared headings, text, badges,
and navigation indicator. There is no Chakra, Emotion, or Framer Motion runtime.

React 19 is required: React 18's document hydration failed when the in-app browser
inserted its sidebar element, replacing the document and discarding its styles.
The server now streams React's markup directly, without an Emotion transform.
