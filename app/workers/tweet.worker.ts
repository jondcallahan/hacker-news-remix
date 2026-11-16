/// <reference lib="webworker" />
import type { Post, RenderOptions } from "@xeet/core";
import { renderPost } from "virtual:xeet-browser";

export type RenderRequest = { id: number; post: Post; options: RenderOptions };
export type RenderReply =
  | { id: number; png: Uint8Array; width: number; height: number }
  | { id: number; error: string };
const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.onmessage = async ({ data }: MessageEvent<RenderRequest>) => {
  try {
    const { png, report } = await renderPost(data.post, data.options);
    scope.postMessage(
      { id: data.id, png, ...report.size } satisfies RenderReply,
      [png.buffer],
    );
  } catch {
    scope.postMessage({
      id: data.id,
      error: "Preview unavailable",
    } satisfies RenderReply);
  }
};
