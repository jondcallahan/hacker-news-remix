/// <reference types="@react-router/node" />
/// <reference types="vite/client" />

declare module "virtual:xeet-browser" {
  import type { Post, RenderOptions, Report } from "@xeet/core";
  export function renderPost(
    post: Post,
    options: RenderOptions,
  ): Promise<{ png: Uint8Array; report: Report }>;
}
