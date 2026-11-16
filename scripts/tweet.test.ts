import { afterEach, expect, spyOn, test } from "bun:test";
import { loadXeet } from "@xeet/core/node";
import { getTweetUrl } from "../app/utils/tweet";
import { getTweetPreview } from "../app/utils/tweet-preview.server";

const xeet = await loadXeet({ lazy: true });
const post = {
  text: "Hello 🌎 — مرحبا — 数学 𝟙𝟚𝟛 ".repeat(6),
  author: { name: "Example", handle: "example" },
};
let restore = () => {};
afterEach(() => restore());

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
    expect(await getTweetPreview(url)).toBeUndefined();
  }
  expect(resolve).not.toHaveBeenCalled();
});

test("measures both responsive layouts without rasterizing on the server", async () => {
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
  const preview = await getTweetPreview(
    "https://twitter.com/example/status/20",
  );
  expect(preview?.post).toEqual(post);
  expect(preview?.layout.mobile).toBeGreaterThan(preview!.layout.desktop);
  expect(preview?.layout.desktop).toBeGreaterThan(0);
  expect(render).not.toHaveBeenCalled();
});

test("failed upstream resolution leaves the normal OG fallback available", async () => {
  const resolve = spyOn(xeet, "resolve").mockRejectedValue(
    new Error("upstream unavailable"),
  );
  const log = spyOn(console, "error").mockImplementation(() => {});
  restore = () => {
    resolve.mockRestore();
    log.mockRestore();
  };
  expect(
    await getTweetPreview("https://x.com/example/status/20"),
  ).toBeUndefined();
});
