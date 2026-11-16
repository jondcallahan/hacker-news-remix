import type { Post } from "@xeet/core";
import { useEffect, useState } from "react";
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
  const [failed, setFailed] = useState(false);
  const [image, setImage] = useState<{ src: string; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!tweetUrl) return;
    const controller = new AbortController();
    const media = window.matchMedia("(max-width: 600px)");
    let disposed = false;
    let version = 0;
    let objectUrl: string | undefined;
    const ready = Promise.all([
      fetch(`/api/tweet-post?url=${encodeURIComponent(tweetUrl)}`, {
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) throw new Error("Post preview unavailable");
        return (await response.json()) as { post: Post };
      }),
      import("virtual:xeet-browser"),
    ]);

    async function paint() {
      const currentVersion = ++version;
      try {
        const [{ post }, { renderPost }] = await ready;
        if (disposed) return;
        const { png } = await renderPost(post, {
          width: media.matches ? 390 : 600,
          dpr: 2,
          theme: "light",
        });
        if (disposed || currentVersion !== version) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(
          new Blob([Uint8Array.from(png).buffer], { type: "image/png" }),
        );
        setImage({ src: objectUrl, text: post.text });
      } catch {
        if (!disposed && currentVersion === version) setFailed(true);
      }
    }

    void paint();
    media.addEventListener("change", paint);
    return () => {
      disposed = true;
      controller.abort();
      media.removeEventListener("change", paint);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tweetUrl]);

  if (tweetUrl && image && !failed) {
    return (
      <img
        src={image.src}
        alt={image.text}
        className="mx-auto block h-auto w-full max-w-[600px] bg-white"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="relative h-[150px] w-full sm:h-[300px]">
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
          className="absolute inset-0 size-full bg-transparent object-cover"
        />
      )}
    </div>
  );
}
