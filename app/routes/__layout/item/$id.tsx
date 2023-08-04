import { json, LoaderArgs, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { fetchAllKids, Item } from "~/utils/api.server";
import {
  Box,
  Heading,
  Text,
  Flex,
  Img,
  Grid,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { getFromCache } from "~/utils/caching.server";
import type { IGetPlaiceholderReturn } from "plaiceholder";
import { Comment } from "~/components/Comment";
import { getTimeZoneFromCookie } from "~/utils/time";
import HeroImage from "~/components/HeroImage";
import { getTweet, Tweet } from "react-tweet/api";

export const handle = {
  showBreadcrumb: true,
};

export const meta: MetaFunction = ({ data }) => ({
  title: `${data.story.title} | HN`,
  "og:title": data.story.title,
  "og:description": data.story.text,
  "og:image": data.story.url ? `/api/ogImage?url=${data.story.url}` : undefined, // Only add og image if url is defined
});

export function getOGImagePlaceholderContent(text: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='1200' height='600' viewBox='0 0 1200 600'><rect fill='lightgrey' width='1200' height='600'></rect><text dy='22.4' x='50%' y='50%' text-anchor='middle' font-weight='bold' fill='rgba(0,0,0,0.5)' font-size='64' font-family='sans-serif'>${text}</text></svg>`;
}

export const loader = async ({ params, request }: LoaderArgs) => {
  const timerStart = process.hrtime();
  const { id } = params;

  if (!id) return redirect("/");

  const cookies = request.headers.get("Cookie");
  let timeZone = "";
  if (cookies) {
    timeZone = getTimeZoneFromCookie(cookies) || "";
  }

  const story = await fetchAllKids(id);
  const OGImagePlaceholder: IGetPlaiceholderReturn | null = story?.url
    ? await getFromCache(`ogimage:placeholder:${story.url}`)
    : null;

  // Log the time it took to get the value in ms
  const timerEnd = process.hrtime(timerStart);
  let tweet: Tweet | undefined;
  if (story?.url.startsWith("https://twitter.com/")) {
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
        !kid || kid.dead || !kid.text || kid.deleted ? null : (
          <Comment key={kid.id} comment={kid} originalPoster={originalPoster}>
            {kid.kids?.length && renderNestedComments(kid.kids, originalPoster)}
          </Comment>
        )
      )}
    </>
  );
}

export default function ItemPage() {
  const { story, OGImagePlaceholder, timeZone, tweet } =
    useLoaderData<typeof loader>();

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
      >
        {story.url ? (
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
        ) : null}
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
              {getDateFormatter(timeZone).format(new Date(story.time * 1_000))}
            </time>
          </Text>
          {story.text ? (
            <Text as="span" dangerouslySetInnerHTML={{ __html: story.text }} />
          ) : null}
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
