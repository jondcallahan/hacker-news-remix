import type { RenderReply, RenderRequest } from "~/workers/tweet.worker";
import type { TweetPreview } from "~/utils/tweet";
import { useEffect, useState, type CSSProperties } from "react";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";
import type { Item } from "~/utils/api.server";
import { getTweetUrl } from "~/utils/tweet";

const getBackgroundImage = (text: string) => {
  return `url("data:image/svg+xml;base64,${btoa(
    getOGImagePlaceholderContent(text),
  )}")`;
};

export default function HeroImage({
  story,
  tweetPreview,
}: {
  story: Item;
  tweetPreview?: TweetPreview;
}) {
  const storyUrl = story.url ?? "https://news.ycombinator.com";
  const tweetUrl = getTweetUrl(storyUrl);
  const [failed, setFailed] = useState(false);
  const [image, setImage] = useState<{
    src: string;
    text: string;
    height: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!tweetUrl || !tweetPreview) return;
    const { post } = tweetPreview;
    const media = window.matchMedia("(max-width: 600px)");
    let disposed = false;
    let version = 0;
    let objectUrl: string | undefined;
    const worker = new Worker(
      new URL("../workers/tweet.worker.ts", import.meta.url),
      { type: "module" },
    );
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
    function paint() {
      const id = ++version;
      try {
        if (disposed) return;
        worker.postMessage({
          id,
          post,
          options: { width: media.matches ? 390 : 600, dpr: 2, theme: "light" },
        } satisfies RenderRequest);
      } catch {
        if (!disposed && id === version) setFailed(true);
      }
    }
    paint();
    media.addEventListener("change", paint);
    return () => {
      disposed = true;
      worker.terminate();
      media.removeEventListener("change", paint);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tweetUrl, tweetPreview]);

  return (
    <div
      style={
        tweetPreview
          ? ({
              "--tweet-mobile-ratio": `390 / ${tweetPreview.layout.mobile}`,
              "--tweet-desktop-ratio": `600 / ${tweetPreview.layout.desktop}`,
            } as CSSProperties)
          : undefined
      }
      className={`relative w-full bg-white ${tweetPreview ? "mx-auto max-w-[600px] aspect-[var(--tweet-mobile-ratio)] min-[601px]:aspect-[var(--tweet-desktop-ratio)]" : "h-[150px] sm:h-[300px]"}`}
    >
      <a href={storyUrl} className="block size-full">
        {tweetUrl && image && !failed ? (
          <img
            src={image.src}
            alt={image.text}
            width={image.width * 2}
            height={image.height * 2}
            className="size-full object-contain"
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
            {(!tweetPreview || failed) && (
              <iframe
                title={`Preview of ${story.title}`}
                src={`/api/ogimage-frame?url=${encodeURIComponent(storyUrl)}`}
                className="absolute inset-0 size-full bg-transparent"
              />
            )}
          </>
        )}
      </a>
    </div>
  );
}
