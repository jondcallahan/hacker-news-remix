import { getTweetPost } from "~/utils/tweet-post.client";
import type { RenderReply, RenderRequest } from "~/workers/tweet.worker";
import { useEffect, useRef, useState } from "react";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";
import type { Item } from "~/utils/api.server";
import { getTweetUrl } from "~/utils/tweet";

const getBackgroundImage = (text: string) => {
  return `url("data:image/svg+xml;base64,${btoa(
    getOGImagePlaceholderContent(text),
  )}")`;
};

export default function HeroImage({ story }: { story: Item }) {
  const storyUrl = story.url ?? "https://news.ycombinator.com";
  const tweetUrl = getTweetUrl(storyUrl);
  const frameRef = useRef<HTMLDivElement>(null);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [image, setImage] = useState<{
    src: string;
    text: string;
    height: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!tweetUrl) return;
    const media = window.matchMedia("(max-width: 600px)");
    let disposed = false;
    let version = 0;
    let objectUrl: string | undefined;
    const worker = new Worker(
      new URL("../workers/tweet.worker.ts", import.meta.url),
      { type: "module" },
    );
    const ready = getTweetPost(tweetUrl);
    worker.onerror = () => {
      if (!disposed) setFailed(true);
    };
    worker.onmessage = async ({ data }: MessageEvent<RenderReply>) => {
      if (disposed || data.id !== version) return;
      if ("error" in data) {
        setFailed(true);
        return;
      }
      const src = URL.createObjectURL(
        new Blob([Uint8Array.from(data.png).buffer], { type: "image/png" }),
      );
      try {
        const decoded = new Image();
        decoded.src = src;
        await decoded.decode();
        if (disposed || data.id !== version) {
          URL.revokeObjectURL(src);
          return;
        }
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = src;
        const { post } = await ready;
        setNeedsExpansion(
          (data.height * (frameRef.current?.clientWidth ?? data.width)) /
            data.width >
            (window.matchMedia("(min-width: 480px)").matches ? 300 : 150),
        );
        setImage({
          src,
          text: post.text,
          width: data.width,
          height: data.height,
        });
      } catch {
        URL.revokeObjectURL(src);
        if (!disposed && data.id === version) setFailed(true);
      }
    };
    async function paint() {
      const id = ++version;
      try {
        const { post } = await ready;
        if (disposed || id !== version) return;
        worker.postMessage({
          id,
          post,
          options: { width: media.matches ? 390 : 600, dpr: 2, theme: "light" },
        } satisfies RenderRequest);
      } catch {
        if (!disposed && id === version) setFailed(true);
      }
    }
    void paint();
    media.addEventListener("change", paint);
    return () => {
      disposed = true;
      worker.terminate();
      media.removeEventListener("change", paint);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tweetUrl]);

  return (
    <div
      ref={frameRef}
      className={`relative w-full bg-white ${expanded && image ? "" : "h-[150px] sm:h-[300px]"}`}
    >
      <a href={storyUrl} className="block size-full">
        {tweetUrl && image && !failed ? (
          <img
            src={image.src}
            alt={image.text}
            width={image.width * 2}
            height={image.height * 2}
            className={
              expanded
                ? "mx-auto block h-auto w-full max-w-[600px]"
                : "size-full object-contain"
            }
            onError={() => setFailed(true)}
          />
        ) : (
          <>
            <div
              className="size-full bg-cover bg-center"
              style={{
                backgroundImage: getBackgroundImage(new URL(storyUrl).hostname),
              }}
            />
            {(!tweetUrl || failed) && (
              <iframe
                title={`Preview of ${story.title}`}
                src={`/api/ogimage-frame?url=${encodeURIComponent(storyUrl)}`}
                className="absolute inset-0 size-full bg-transparent"
              />
            )}
          </>
        )}
      </a>
      {tweetUrl && image && !failed && (needsExpansion || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="absolute right-2 bottom-2 rounded-md bg-white px-3 py-2 text-sm font-semibold shadow-card"
        >
          {expanded ? "Collapse post" : "Expand post"}
        </button>
      )}
    </div>
  );
}
