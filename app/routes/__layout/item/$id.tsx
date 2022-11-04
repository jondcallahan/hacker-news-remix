import { json, LoaderArgs, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { fetchAllKids, Item } from "~/utils/api.server";
import { getRelativeTimeString } from "~/utils/time";
import {
  Box,
  Heading,
  Text,
  chakra,
  Flex,
  Img,
  Grid,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { getFromCache } from "~/utils/caching.server";
import type { IGetPlaiceholderReturn } from "plaiceholder";

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
  // TODO: Figure out how to get the story url before fetching all kids
  // That way we can get the og image placeholder before fetching all kids
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

export default function Item() {
  const { story, OGImagePlaceholder } = useLoaderData<typeof loader>();

  if (!story) {
    return null;
  }

  // TODO: Remove this duplicated code by extracting the comment details/summary to a separate component
  function renderKids(kids) {
    return (
      <>
        {kids?.map((kid) =>
          !kid || kid.dead || !kid.text || kid.deleted ? null : (
            <chakra.details
              key={kid.id}
              onClick={(e) => {
                // TODO: Collapse the details on clicking the text
                if (
                  e.nativeEvent.target.tagName !== "A" &&
                  e.nativeEvent.target.tagName !== "SUMMARY"
                ) {
                  e.currentTarget.removeAttribute("open");
                  e.stopPropagation(); // don't bubble up to the next details
                }
              }}
              marginTop="2"
              open
            >
              <chakra.summary
                fontWeight="semibold"
                flex="1"
                textAlign="left"
                padding={4}
                backgroundColor="gray.100"
                borderRadius="lg"
                sx={{
                  "details[open]>&": {
                    borderBottomRadius: "0",
                  },
                }}
              >
                {kid.by} | {kid.kids?.length || "0"}{" "}
                {kid.kids?.length === 1 ? "comment" : "comments"}
                {" | "}
                {getRelativeTimeString(kid.time * 1_000)}
              </chakra.summary>
              <Box
                borderLeft="1px"
                borderColor={"transparent"}
                transition="border-color ease-in 0.17s"
                sx={{
                  "@media (hover: hover)": {
                    _hover: {
                      borderColor: "orange.300",
                    },
                  },
                }}
              >
                <Text
                  as="div"
                  fontFamily="serif"
                  marginX={4}
                  dangerouslySetInnerHTML={{ __html: kid.text }}
                />
                {kid.kids?.length && (
                  <Box paddingX={2}>{renderKids(kid.kids)}</Box>
                )}
              </Box>
            </chakra.details>
          )
        )}
      </>
    );
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
          <a href={story.url}>
            <Img
              src={`/api/ogImage?url=${story.url}`}
              width="full"
              height={["150px", "300px"]}
              borderBottomWidth="2px"
              borderBottomColor="gray.100"
              borderBottomStyle="solid"
              borderTopRadius="lg"
              objectFit="cover"
              backgroundSize="cover"
              backgroundImage={
                OGImagePlaceholder?.base64 ||
                getBackgroundImage(new URL(story.url).hostname)
              }
            />
          </a>
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
            <chakra.details
              borderRadius="lg"
              backgroundColor="orange.50"
              key={comment.id}
              open
              cursor="pointer"
              width="full"
              onClick={(e) => {
                // TODO: Collapse the details on clicking the text
                if (
                  e.nativeEvent.target.tagName !== "A" &&
                  e.nativeEvent.target.tagName !== "SUMMARY"
                ) {
                  e.currentTarget.removeAttribute("open");
                }
              }}
              boxShadow="md"
            >
              <chakra.summary
                fontWeight="semibold"
                flex="1"
                padding={4}
                textAlign="left"
                backgroundColor="gray.100"
                borderRadius="lg"
                sx={{
                  "details[open]>&": {
                    borderBottomRadius: "0",
                  },
                }}
              >
                {comment.by} | {comment.kids?.length || "0"}{" "}
                {comment.kids?.length === 1 ? "comment" : "comments"}
                {" | "}
                {getRelativeTimeString(comment.time * 1_000)}
              </chakra.summary>

              <Box
                paddingY={2}
                borderLeft="1px"
                borderColor={"transparent"}
                transition="border-color ease-in 0.17s"
                sx={{
                  "@media (hover: hover)": {
                    _hover: {
                      borderColor: "orange.300",
                    },
                  },
                }}
              >
                <Text
                  as="div"
                  fontFamily="serif"
                  marginX={4}
                  dangerouslySetInnerHTML={{ __html: comment.text }}
                />

                {comment.kids?.length && (
                  <Box paddingX={2}>{renderKids(comment.kids)}</Box>
                )}
              </Box>
            </chakra.details>
          );
        })}
      </Flex>
    </>
  );
}
