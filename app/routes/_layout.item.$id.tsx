import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/server-runtime";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { fetchAllKids, Item } from "~/utils/api.server.ts";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Img,
  Link as ChakraLink,
  Text,
} from "@chakra-ui/react";
import { getFromCache } from "~/utils/caching.server.ts";
import type { GetPlaiceholderReturn } from "plaiceholder";
import { Comment } from "~/components/Comment.tsx";
import { getTimeZoneFromCookie } from "~/utils/time.ts";
import HeroImage from "~/components/HeroImage.tsx";
import { getTweet, Tweet } from "react-tweet/api";
import { useHotkeys } from "react-hotkeys-hook";
import process from "node:process";

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

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const timerStart = process.hrtime();
  const { id } = params;

  if (!id) return redirect("/");

  const cookies = request.headers.get("Cookie");
  let timeZone = "";
  if (cookies) {
    timeZone = getTimeZoneFromCookie(cookies) || "America/Los_Angeles";
  }

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

  return json({ story, OGImagePlaceholder, timeZone, tweet });
};

const getDateFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone,
  });

// Recursively render all comments and their children
function renderNestedComments(kids: Item[], originalPoster?: string) {
  return (
    <>
      {kids?.map((kid) =>
        !kid || kid.dead || !kid.text || kid.deleted
          ? null
          : (
            <Comment key={kid.id} comment={kid} originalPoster={originalPoster}>
              {kid.kids?.length &&
                renderNestedComments(kid.kids, originalPoster)}
            </Comment>
          )
      )}
    </>
  );
}

export default function ItemPage() {
  const { story, OGImagePlaceholder, timeZone, tweet } = useLoaderData<
    typeof loader
  >();
  const navigate = useNavigate();

  useHotkeys("h", () => {
    navigate("/", {
      viewTransition: true,
    });
  });

  useHotkeys("j", () => {
    // Get the current scroll position
    const scrollPosition = window.scrollY;

    // Get all the comments
    const comments = document.querySelectorAll("[data-testid=comment]");

    // Find the first comment that is below the current scroll position
    const nextComment = Array.from(comments).find(
      (comment) => comment.getBoundingClientRect().top > scrollPosition,
    );

    // If we found a comment, focus it
    if (nextComment) {
      nextComment.focus();
    } // Otherwise, focus the first comment
    else {
      comments[0]?.focus();
    }

    // Scroll to the focused comment
    window.scrollTo({
      top: nextComment?.getBoundingClientRect().top,
      behavior: "smooth",
    });
  });

  useHotkeys("k", () => {
    // Get the current scroll position
    const scrollPosition = window.scrollY;

    // Get all the comments
    const comments = document.querySelectorAll("[data-testid=comment]");

    // Find the last comment that is above the current scroll position
    const previousComment = Array.from(comments)
      .reverse()
      .find((comment) => comment.getBoundingClientRect().top < scrollPosition);

    // If we found a comment, focus it
    if (previousComment) {
      previousComment.focus();
    } // Otherwise, focus the last comment
    else {
      comments[comments.length - 1]?.focus();
    }

    // Scroll to the focused comment
    window.scrollTo({
      top: previousComment?.getBoundingClientRect().top,
      behavior: "smooth",
    });
  });

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
        <Grid gap={1} paddingX={3} paddingY={2}>
          <Heading size="md">{story?.title}</Heading>
          <ChakraLink
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            href={story.url}
          >
            {story.url}
          </ChakraLink>
          <Text>
            By {story.by} at{" "}
            <time>
              {getDateFormatter(timeZone)
                .format(new Date(story.time * 1_000))
                .split(/\s|&nbsp;/g) // Browser version uses a space, server uses &nbsp; this causes a hydration error so we replace it with a space to make it consistent
                .join(" ")}
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
        </Grid>
      </Box>
      {/* End story card */}
      <Flex wrap="wrap" gap={4}>
        {story.kids?.map((comment) => {
          if (!comment || comment.dead || comment.deleted) return null;
          return (
            <Comment
              key={comment.id}
              comment={comment}
              borderRadius="lg"
              backgroundColor="orange.50"
              width="full"
              boxShadow="md"
              boxProps={{
                paddingY: 2,
              }}
              marginTop={0}
              originalPoster={story.by}
              data-testid="comment"
            >
              {comment.kids?.length &&
                renderNestedComments(comment.kids, story.by)}
            </Comment>
          );
        })}
      </Flex>
    </>
  );
}
