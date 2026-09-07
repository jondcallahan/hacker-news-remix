import { useEffect, useRef, useState } from "react";
import {
  useLoaderData,
  useNavigate,
} from "react-router";
import type { Item } from "~/utils/api.server";
import { haptic } from "ios-haptics";
import { getTopStories } from "~/utils/api.server";
import { StoryCard } from "~/components/StoryCard";
import { Text } from "~/components/ui";
import { useHotkeys } from "react-hotkeys-hook";

export async function loader() {
  const timerStart = process.hrtime();

  const storiesPerPage = 30;
  const allStories = (await getTopStories(storiesPerPage)) ?? [];
  const stories = allStories.filter((story): story is Item => story != null);

  // Log the time it took to get the value in ms
  const timerEnd = process.hrtime(timerStart);
  console.log(`topstories took ${timerEnd[0] * 1e3 + timerEnd[1] / 1e6}ms`);

  return { allStories: stories };
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <Text>Something went wrong</Text>
      <code className="rounded-sm bg-red-100 px-1 text-sm text-red-800">{error?.message || "Unknown error"}</code>
    </div>
  );
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const stories = data?.allStories ?? [];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedIndex !== null && cardRefs.current[selectedIndex]) {
      cardRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedIndex]);

  // j - move down to next story
  useHotkeys(
    "j",
    () => {
      setSelectedIndex((prev) => {
        if (prev === null) return 0;
        return Math.min(prev + 1, stories.length - 1);
      });
    },
    { preventDefault: true }
  );

  // k - move up to previous story
  useHotkeys(
    "k",
    () => {
      setSelectedIndex((prev) => {
        if (prev === null) return stories.length - 1;
        return Math.max(prev - 1, 0);
      });
    },
    { preventDefault: true }
  );

  // c - go to comments for selected story
  useHotkeys(
    "c",
    () => {
      if (selectedIndex !== null && stories[selectedIndex]) {
        haptic();
        navigate(`/item/${stories[selectedIndex].id}`, {
          viewTransition: true,
        });
      }
    },
    { preventDefault: true },
    [selectedIndex, stories]
  );

  // Enter - open story URL (or comments if no URL)
  useHotkeys(
    "enter",
    () => {
      if (selectedIndex !== null && stories[selectedIndex]) {
        const story = stories[selectedIndex];
        haptic();
        if (story.url) {
          window.open(story.url, "_blank");
        } else {
          navigate(`/item/${story.id}`, { viewTransition: true });
        }
      }
    },
    { preventDefault: true },
    [selectedIndex, stories]
  );

  // Escape - clear selection
  useHotkeys(
    "escape",
    () => {
      setSelectedIndex(null);
    },
    { preventDefault: true }
  );

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {stories.map((story, index) => (
        <StoryCard key={story.id} story={story} selected={selectedIndex === index}
          ref={(el) => { cardRefs.current[index] = el; }} />
      ))}
    </div>
  );
}
