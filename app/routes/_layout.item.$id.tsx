import { useEffect, useRef, useState, useMemo } from "react";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { fetchAllKids, Item } from "~/utils/api.server";
import { Heading, Text } from "~/components/ui";
import { getFromCache } from "~/utils/caching.server";
import type { GetPlaiceholderReturn } from "plaiceholder";
import { Comment } from "~/components/Comment";
import { getTimeZoneFromCookie } from "~/utils/time";
import HeroImage from "~/components/HeroImage";
import { getTweet, Tweet } from "react-tweet/api";
import { useHotkeys } from "react-hotkeys-hook";
import { haptic } from "ios-haptics";

export const handle = {
  showBreadcrumb: true,
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: `${data?.story?.title} | HN`,
  },
  {
    property: "og:title",
    content: data?.story?.title,
  },
  {
    property: "og:description",
    content: data?.story?.text,
  },
  {
    property: "og:image",
    content: data?.story?.url
      ? `/api/ogImage?url=${data?.story?.url}`
      : undefined, // Only add og image if url is defined
  },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const timerStart = process.hrtime();
  const { id } = params;

  if (!id) return redirect("/");

  const cookies = request.headers.get("Cookie");
  let timeZone = "America/Los_Angeles";
  if (cookies) {
    timeZone = getTimeZoneFromCookie(cookies) || "America/Los_Angeles";
  }

  // Fetch the story with all comments
  const story = await fetchAllKids(id);
  const OGImagePlaceholder: GetPlaiceholderReturn | null = story?.url
    ? await getFromCache(`ogimage:placeholder:${story.url}`)
    : null;

  // Log the time it took to get the value in ms
  const timerEnd = process.hrtime(timerStart);
  let tweet: Tweet | undefined;
  if (story?.url?.startsWith("https://twitter.com/")) {
    const tweetId = story.url.split("/").pop()!;

    tweet = await getTweet(tweetId);
  }
  console.log(`item:${id} took ${timerEnd[0] * 1e3 + timerEnd[1] / 1e6}ms`);

  return { story, OGImagePlaceholder, timeZone, tweet };
}

const getDateFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone,
  });

// Recursively render all comments and their children
function renderNestedComments(
  kids: (Item | number)[],
  originalPoster?: string,
) {
  return (
    <>
      {kids?.map((kid) => {
        // Skip ID-only comments (not loaded yet)
        if (typeof kid === "number") {
          return null;
        }

        // Skip dead, deleted or empty comments
        if (!kid || kid.dead || !kid.text || kid.deleted) {
          return null;
        }

        return (
          <Comment key={kid.id} comment={kid} originalPoster={originalPoster}>
            {!!kid.kids?.length && Array.isArray(kid.kids) &&
              renderNestedComments(kid.kids, originalPoster)}
          </Comment>
        );
      })}
    </>
  );
}

export default function ItemPage() {
  const { story, OGImagePlaceholder, timeZone, tweet } = useLoaderData<
    typeof loader
  >();
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const commentRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  // Get top-level comments only
  const topLevelComments = useMemo(() => {
    if (!story?.kids) return [];
    return story.kids.filter((kid): kid is Item => {
      if (typeof kid === "number") return false;
      if (!kid) return false;
      if (kid.dead || kid.deleted) return false;
      return true;
    });
  }, [story?.kids]);

  // Scroll selected comment into view
  useEffect(() => {
    if (selectedIndex !== null && commentRefs.current[selectedIndex]) {
      commentRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedIndex]);

  // h - go back home
  useHotkeys(
    "h",
    () => {
      haptic();
      navigate("/", { viewTransition: true });
    },
    { preventDefault: true }
  );

  // j - move down to next comment
  useHotkeys(
    "j",
    () => {
      setSelectedIndex((prev) => {
        if (prev === null) return 0;
        return Math.min(prev + 1, topLevelComments.length - 1);
      });
    },
    { preventDefault: true }
  );

  // k - move up to previous comment
  useHotkeys(
    "k",
    () => {
      setSelectedIndex((prev) => {
        if (prev === null) return topLevelComments.length - 1;
        return Math.max(prev - 1, 0);
      });
    },
    { preventDefault: true }
  );

  // Enter - toggle open/close selected comment
  useHotkeys(
    "enter",
    () => {
      if (selectedIndex !== null && commentRefs.current[selectedIndex]) {
        const details = commentRefs.current[selectedIndex];
        if (details) {
          haptic();
          details.open = !details.open;
        }
      }
    },
    { preventDefault: true },
    [selectedIndex]
  );

  // Escape - clear selection
  useHotkeys(
    "escape",
    () => {
      setSelectedIndex(null);
    },
    { preventDefault: true }
  );

  if (!story) {
    return null;
  }

  return (
    <>
      <div className="mb-4 overflow-hidden rounded-lg bg-orange-50 shadow-card" style={{ viewTransitionName: "story-title" }}>
        {story.url && (
          <div className="relative h-[150px] w-full overflow-hidden rounded-t-lg border-b-2 border-gray-100 sm:h-[300px]">
            <a href={story.url}>
              <HeroImage story={story} OGImagePlaceholder={OGImagePlaceholder} tweet={tweet} />
            </a>
          </div>
        )}
        <div className="flex flex-col gap-1 px-3 py-2">
          <Heading>{story.title}</Heading>
          <Text className="truncate"><a href={story.url}>{story.url}</a></Text>
          <Text>By {story.by} at <time>{getDateFormatter(timeZone).format(new Date(story.time * 1_000))}</time></Text>
          {story.text && <span className="text-lg leading-[1.65]" dangerouslySetInnerHTML={{ __html: story.text }} />}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {topLevelComments.map((comment, index) => {
          const isSelected = selectedIndex === index;

          return (
            <Comment
              key={comment.id}
              ref={(el) => {
                commentRefs.current[index] = el;
              }}
              comment={comment}
              topLevel
              selected={isSelected}
              originalPoster={story.by}
              data-testid="comment"
            >
              {!!comment.kids?.length && Array.isArray(comment.kids) &&
                renderNestedComments(comment.kids, story.by)}
            </Comment>
          );
        })}
      </div>
    </>
  );
}
