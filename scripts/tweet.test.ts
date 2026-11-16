import { afterEach, expect, spyOn, test } from "bun:test";
import { loadXeet } from "@xeet/core/node";
import { getTweetUrl } from "../app/utils/tweet";
import { loader } from "../app/routes/api.tweet";

const xeet = await loadXeet({ lazy: true });
const post = {
  text: "Hello 🌎 — مرحبا — 数学 𝟙𝟚𝟛",
  author: { name: "Example", handle: "example" },
};
let restore = () => {};
afterEach(() => restore());

function request(url: string, width = 600) {
  return loader({
    request: new Request(
      `http://localhost/api/tweet?url=${encodeURIComponent(url)}&width=${width}`,
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

test("serves real PNGs with font packs and mobile/desktop dimensions", async () => {
  const resolve = spyOn(xeet, "resolve").mockResolvedValue({
    post,
    links: {},
    media: {},
    source: {},
    warnings: [],
  });
  restore = () => resolve.mockRestore();
  for (const width of [390, 600, 99999]) {
    const response = await request(
      "https://twitter.com/example/status/20",
      width,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
    const png = Buffer.from(await response.arrayBuffer());
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe((width === 390 ? 390 : 600) * 2);
    expect(png.readUInt32BE(20)).toBeGreaterThan(0);
  }
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
