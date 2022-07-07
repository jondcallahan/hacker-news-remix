import { json, LoaderFunction, MetaFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getItem } from "~/utils/api.server";
import { getRelativeTimeString } from "~/utils/time";
import {
  Box,
  Heading,
  Text,
  chakra,
  Container,
  Flex,
  Img,
  Grid,
} from "@chakra-ui/react";

export const handle = {
  showBreadcrumb: true,
};

export const meta: MetaFunction = ({ data }) => ({
  title: `${data.story.title} | HN`,
  "og:title": data.story.title,
  "og:description": data.story.text,
  "og:image": data.story.url ? `/api/ogImage?url=${data.story.url}` : undefined, // Only add og image if url is defined
});

const fetchById = async (id: string) => await getItem(id);

const fetchAllKids = async (id: string) => {
  const item = await fetchById(id);

  await Promise.all(
    item?.kids?.map(
      async (id: string, index: number) =>
        (item.kids[index] = await fetchAllKids(id))
    ) || []
  );

  return item;
};

const getBackgroundImage = (text: string) => {
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='1200' height='600' viewBox='0 0 1200 600'><rect fill='lightgrey' width='1200' height='600'></rect><text dy='22.4' x='50%' y='50%' text-anchor='middle' font-weight='bold' fill='rgba(0,0,0,0.5)' font-size='64' font-family='sans-serif'>${text}</text></svg>")`;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { id } = params;

  if (!id) return redirect("/");

  const story = await fetchAllKids(id);

  return json({ story });
};
const dateFormat = new Intl.DateTimeFormat("en", {
  // dateStyle: "long",
  timeStyle: "short",
});

export default function Item() {
  const { story } = useLoaderData();

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
              paddingLeft="2"
              marginTop="2"
              open
            >
              <chakra.summary
                fontWeight="semibold"
                flex="1"
                textAlign="left"
                paddingX={2}
                paddingY={4}
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
              <Box marginX={2}>
                <Text
                  as="div"
                  fontFamily="serif"
                  dangerouslySetInnerHTML={{ __html: kid.text }}
                  sx={{
                    "@media (hover: hover)": {
                      _hover: { backgroundColor: "orange.100" },
                    },
                  }}
                />
                {kid.kids?.length && (
                  <Box paddingLeft={2}>{renderKids(kid.kids)}</Box>
                )}
              </Box>
            </chakra.details>
          )
        )}
      </>
    );
  }

  return (
    <main>
      <Container>
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
                backgroundImage={getBackgroundImage(
                  new URL(story.url).hostname
                )}
              />
            </a>
          ) : null}
          <Grid gap={1} paddingX={3} paddingY={2}>
            <Heading size="md">{story?.title}</Heading>
            <a href={story.url}>{story.url}</a>
            <Text>
              By {story.by} {dateFormat.format(new Date(story.time * 1_000))}
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

                <Box marginX={4} marginY={2}>
                  <Text
                    as="div"
                    fontFamily="serif"
                    dangerouslySetInnerHTML={{ __html: comment.text }}
                    sx={{
                      "@media (hover: hover)": {
                        _hover: { backgroundColor: "orange.100" },
                      },
                    }}
                  />

                  {comment.kids?.length && renderKids(comment.kids)}
                </Box>
              </chakra.details>
            );
          })}
        </Flex>
      </Container>
    </main>
  );
}
