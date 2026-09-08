import { forwardRef } from "react";
import { Link, NavLink } from "react-router";
import { haptic } from "ios-haptics";
import type { Item } from "~/utils/api.server";
import { Heading, StoryBadge, Text } from "./ui";

export const StoryCard = forwardRef<HTMLDivElement, { story: Item; selected: boolean }>(
  function StoryCard({ story, selected }, ref) {
    const hostname = story.url ? new URL(story.url).hostname : undefined;
    return (
      <div
        ref={ref}
        data-story-card
        className={`grid w-full rounded-lg bg-orange-50 p-4 transition-all duration-200 hover:shadow-raised ${selected ? "outline-3 outline-offset-2 outline-blue-500 shadow-raised" : "outline-none"}`}
      >
        <div className="grid gap-2">
          {hostname && (
            <div className="flex items-center">
              <img src={`https://icons.duckduckgo.com/ip3/${hostname}.ico`} alt={`Icon for ${hostname}`} className="mr-2 size-4 text-transparent" />
              <Text className="break-all">{hostname.replace("www.", "")}</Text>
            </div>
          )}
          <Link to={story.url || `/item/${story.id}`}>
            <Heading className="scroll-my-16" data-link-type="story">{story.title}</Heading>
          </Link>
          <Text>By {story.by} {story.relativeTime}</Text>
          <NavLink
            to={`/item/${story.id}`}
            prefetch="intent"
            className="group flex w-full justify-between gap-2 no-underline"
            aria-label={`View comments for ${story.title}`}
            viewTransition
            onClick={() => haptic()}
          >
            <StoryBadge kind="points">{story.score} points </StoryBadge>
            <StoryBadge kind="comments">{story.descendants || "0"} {story.descendants === 1 ? "comment" : "comments"}</StoryBadge>
          </NavLink>
        </div>
      </div>
    );
  },
);
