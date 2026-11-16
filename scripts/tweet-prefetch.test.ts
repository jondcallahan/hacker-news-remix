import { expect, spyOn, test } from "bun:test";
import { getTweetPost } from "../app/utils/tweet-post.client";

const data = { post: { text: "A prefetched post" } };

test("viewport fetch and navigation share one request across equivalent tweet links", async () => {
  const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(data),
  );
  try {
    const viewport = getTweetPost(
      "https://twitter.com/example/status/90001?s=20",
    );
    const navigation = getTweetPost("https://x.com/i/web/status/90001");
    expect(viewport).toBe(navigation);
    expect(await navigation).toEqual(data);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    fetch.mockRestore();
  }
});

test("visible tweet cards limit requests to two until one finishes", async () => {
  const finish: ((response: Response) => void)[] = [];
  const fetch = spyOn(globalThis, "fetch").mockImplementation(
    (() =>
      new Promise<Response>((resolve) =>
        finish.push(resolve),
      )) as unknown as typeof globalThis.fetch,
  );
  try {
    const requests = [90002, 90003, 90004].map((id) =>
      getTweetPost(`https://x.com/example/status/${id}`),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    finish[0](Response.json(data));
    await requests[0];
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(3);
    finish[1](Response.json(data));
    finish[2](Response.json(data));
    await Promise.all(requests);
  } finally {
    fetch.mockRestore();
  }
});

test("failed speculative fetch backs off before retrying on navigation", async () => {
  let now = Date.now();
  const clock = spyOn(Date, "now").mockImplementation(() => now);
  const fetch = spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("upstream unavailable"),
  );
  try {
    await expect(
      getTweetPost("https://x.com/example/status/90005"),
    ).rejects.toThrow("upstream unavailable");
    await expect(
      getTweetPost("https://x.com/example/status/90005"),
    ).rejects.toThrow("upstream unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
    now += 31_000;
    fetch.mockResolvedValue(Response.json(data));
    expect(await getTweetPost("https://x.com/example/status/90005")).toEqual(
      data,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  } finally {
    fetch.mockRestore();
    clock.mockRestore();
  }
});

test("successful client entries expire after an hour", async () => {
  let now = Date.now();
  const clock = spyOn(Date, "now").mockImplementation(() => now);
  const fetch = spyOn(globalThis, "fetch").mockImplementation((async () =>
    Response.json(data)) as unknown as typeof globalThis.fetch);
  try {
    await getTweetPost("https://x.com/example/status/90006");
    now += 3601_000;
    await getTweetPost("https://x.com/example/status/90006");
    expect(fetch).toHaveBeenCalledTimes(2);
  } finally {
    fetch.mockRestore();
    clock.mockRestore();
  }
});
