import { useState } from "react";
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

  if (tweetUrl && !failed) {
    return (
      <picture>
        <source
          media="(max-width: 600px)"
          srcSet={`/api/tweet?url=${encodeURIComponent(tweetUrl)}&width=390`}
        />
        <img
          src={`/api/tweet?url=${encodeURIComponent(tweetUrl)}`}
          alt={`X post: ${story.title}`}
          className="mx-auto block h-auto w-full max-w-[600px] bg-white"
          onError={() => setFailed(true)}
        />
      </picture>
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
      <iframe
        title={`Preview of ${story.title}`}
        src={`/api/ogimage-frame?url=${encodeURIComponent(storyUrl)}`}
        className="absolute inset-0 size-full bg-transparent object-cover"
      />
    </div>
  );
}
