import { afterEach, expect, spyOn, test } from "bun:test";
import { loadXeet } from "@xeet/core/node";
import { getTweetUrl } from "../app/utils/tweet";
import { loader } from "../app/routes/api.tweet-post";

const xeet = await loadXeet({ lazy: true });
const post = {
  text: "Hello 🌎 — مرحبا — 数学 𝟙𝟚𝟛",
  author: { name: "Example", handle: "example" },
};
let restore = () => {};
afterEach(() => restore());

function request(url: string) {
  return loader({
    request: new Request(
      `http://localhost/api/tweet-post?url=${encodeURIComponent(url)}`,
    ),
    params: {},
    context: {},
  });
}

test("normalizes X and Twitter status links, including queries and media suffixes", () => {
  for (const url of [
    "https://x.com/jack/status/20?s=20",
    "http://twitter.com/jack/status/20#reply",
    "https://mobile.twitter.com/jack/status/20/photo/1",
    "https://www.x.com/jack/status/20/video/1",
    "https://x.com/i/web/status/20",
  ]) {
    expect(getTweetUrl(url)).toBe("https://x.com/i/web/status/20");
  }
});

test("rejects non-post links and lookalike hosts before resolving", async () => {
  const resolve = spyOn(xeet, "resolve");
  restore = () => resolve.mockRestore();
  for (const url of [
    "",
    "garbage",
    "https://x.com/jack",
    "https://x.com/jack/status/nope",
    "https://x.com.evil.test/jack/status/20",
    "https://example.com/jack/status/20",
    "ftp://x.com/jack/status/20",
  ]) {
    expect(getTweetUrl(url)).toBeNull();
    expect((await request(url)).status).toBe(400);
  }
  expect(resolve).not.toHaveBeenCalled();
});

test("serves post data for client rendering without rasterizing on the server", async () => {
  const resolve = spyOn(xeet, "resolve").mockResolvedValue({
    post,
    links: {},
    media: {},
    source: {},
    warnings: [],
  });
  const render = spyOn(xeet, "render");
  restore = () => {
    resolve.mockRestore();
    render.mockRestore();
  };
  const response = await request("https://twitter.com/example/status/20");
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toContain("application/json");
  expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
  expect(await response.json()).toEqual({ post });
  expect(render).not.toHaveBeenCalled();
});

test("failed upstream resolution returns an uncacheable error for the image fallback", async () => {
  const resolve = spyOn(xeet, "resolve").mockRejectedValue(
    new Error("upstream unavailable"),
  );
  const log = spyOn(console, "error").mockImplementation(() => {});
  restore = () => {
    resolve.mockRestore();
    log.mockRestore();
  };
  const response = await request("https://x.com/example/status/20");
  expect(response.status).toBe(502);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
