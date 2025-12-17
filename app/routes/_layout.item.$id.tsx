import { useEffect, useRef, useState, useMemo } from "react";
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { fetchAllKids, Item } from "~/utils/api.server";
import {
  Box,
  Flex,
  Heading,
  Img,
  Link as ChakraLink,
  Stack,
  Text,
} from "@chakra-ui/react";
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
  let timeZone = "";
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
            {kid.kids?.length && Array.isArray(kid.kids) &&
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
      {/* Story Card */}
      <Box
        backgroundColor="orange.50"
        borderRadius="lg"
        marginBottom={4}
        boxShadow="md"
        overflow="hidden"
        style={{
          viewTransitionName: "story-title",
        }}
      >
        {story.url
          ? (
            <Box
              width="full"
              overflow="hidden"
              borderTopRadius="lg"
              position="relative"
              height={["150px", "300px"]}
              borderBottomWidth="2px"
              borderBottomColor="gray.100"
              borderBottomStyle="solid"
            >
              <a href={story.url}>
                <HeroImage
                  story={story}
                  OGImagePlaceholder={OGImagePlaceholder}
                  tweet={tweet}
                />
              </a>
            </Box>
          )
          : null}
        <Stack spacing={1} paddingX={3} paddingY={2}>
          <Heading size="md">{story?.title}</Heading>
          <Text isTruncated>
            <ChakraLink href={story.url}>{story.url}</ChakraLink>
          </Text>
          <Text>
            By {story.by} at{" "}
            <time>
              {getDateFormatter(timeZone).format(new Date(story.time * 1_000))}
            </time>
          </Text>
          {story.text
            ? (
              <Text
                as="span"
                dangerouslySetInnerHTML={{ __html: story.text }}
              />
            )
            : null}
        </Stack>
      </Box>
      {/* End story card */}
      <Flex wrap="wrap" gap={4}>
        {topLevelComments.map((comment, index) => {
          const isSelected = selectedIndex === index;

          return (
            <Comment
              key={comment.id}
              ref={(el) => {
                commentRefs.current[index] = el;
              }}
              comment={comment}
              borderRadius="lg"
              backgroundColor="orange.50"
              width="full"
              boxShadow={isSelected ? "lg" : "md"}
              outline={isSelected ? "3px solid" : "none"}
              outlineColor={isSelected ? "blue.500" : "transparent"}
              outlineOffset="2px"
              scrollMarginY="80px"
              boxProps={{
                paddingY: 2,
              }}
              marginTop={0}
              originalPoster={story.by}
              data-testid="comment"
            >
              {comment.kids?.length && Array.isArray(comment.kids) &&
                renderNestedComments(comment.kids, story.by)}
            </Comment>
          );
        })}
      </Flex>
    </>
  );
}
