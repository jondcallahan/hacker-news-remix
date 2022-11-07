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
import { useState } from "react";

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

const getBackgroundImage = (text: string) => {
  return `url("data:image/svg+xml;utf8,${getOGImagePlaceholderContent(text)}")`;
};

export const loader = async ({ params }: LoaderArgs) => {
  const timerStart = process.hrtime();
  const { id } = params;

  if (!id) return redirect("/");

  const story = await fetchAllKids(id);
  const OGImagePlaceholder: IGetPlaiceholderReturn | null = story?.url
    ? await getFromCache(`ogimage:placeholder:${story.url}`)
    : null;

  // Log the time it took to get the value in ms
  const timerEnd = process.hrtime(timerStart);
  console.log(`item:${id} took ${timerEnd[0] * 1e3 + timerEnd[1] / 1e6}ms`);

  return json({ story, OGImagePlaceholder });
};

const dateFormat = new Intl.DateTimeFormat("en", {
  timeStyle: "short",
});

// Recursively render all comments and their children
function renderNestedComments(kids: Item[]) {
  return (
    <>
      {kids?.map((kid) =>
        !kid || kid.dead || !kid.text || kid.deleted ? null : (
          <Comment key={kid.id} comment={kid}>
            {kid.kids?.length && renderNestedComments(kid.kids)}
          </Comment>
        )
      )}
    </>
  );
}

export default function Item() {
  const { story, OGImagePlaceholder } = useLoaderData<typeof loader>();

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
              <Img
                src={OGImagePlaceholder?.base64}
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                width="full"
                height={["150px", "300px"]}
                objectFit="cover"
                filter={OGImagePlaceholder?.base64 ? "blur(10px)" : undefined}
                transform={
                  OGImagePlaceholder?.base64 ? "scale(1.1)" : undefined
                }
                backgroundImage={getBackgroundImage(
                  new URL(story.url).hostname
                )}
                backgroundSize="cover"
              />
              <Img
                src={`/api/ogImage?url=${story.url}`}
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                width="full"
                height={["150px", "300px"]}
                objectFit="cover"
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
            By {story.by} at {dateFormat.format(new Date(story.time * 1_000))}
          </Text>
          <Text
            as="span"
            dangerouslySetInnerHTML={{ __html: story.text }}
          ></Text>
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
            >
              {comment.kids?.length && renderNestedComments(comment.kids)}
            </Comment>
          );
        })}
      </Flex>
    </>
  );
}
