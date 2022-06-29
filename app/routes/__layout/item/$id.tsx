import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getItem } from "~/utils/api.server";
import stylesUrl from "~/styles/item.css";
import { getRelativeTimeString } from "~/utils/time";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  Box,
  Heading,
  Text,
  chakra,
  Grid,
  Container,
} from "@chakra-ui/react";

// export const links: LinksFunction = () => [
//   {
//     rel: "stylesheet",
//     href: stylesUrl,
//   },
// ];

export const handle = {
  showBreadcrumb: true,
};

export const meta: MetaFunction = ({ data }) => ({
  title: `HN | ${data.story.title}`,
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
  const { story, allComments = [] } = useLoaderData();

  if (!story) {
    return null;
  }

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
                borderRadius="md"
              >
                {kid.by} | {kid.kids?.length || "0"}{" "}
                {kid.kids?.length === 1 ? "comment" : "comments"}
                {" | "}
                {getRelativeTimeString(kid.time * 1_000)}
              </chakra.summary>
              <Box marginX={2}>
                <Text
                  fontFamily="serif"
                  dangerouslySetInnerHTML={{ __html: kid.text }}
                ></Text>
                {kid.kids?.length && (
                  <Accordion paddingLeft={2}>{renderKids(kid.kids)}</Accordion>
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
        <section>
          <Heading size="md">{story?.title}</Heading>
          <a href={story.url}>{story.url}</a>
          <Text>
            By {story.by} {dateFormat.format(new Date(story.time * 1_000))}
          </Text>
          <Text
            className="text"
            dangerouslySetInnerHTML={{ __html: story.text }}
          ></Text>
        </section>
        <Grid gap={4}>
          {story.kids?.map((comment) => {
            if (!comment || comment.dead || comment.deleted) return null;
            return (
              <chakra.details
                borderWidth="1px"
                borderStyle="solid"
                borderColor="gray.100"
                borderRadius="md"
                backgroundColor="white"
                key={comment.id}
                open
                cursor="pointer"
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
                {/* <summary> */}
                <chakra.summary
                  fontWeight="semibold"
                  flex="1"
                  textAlign="left"
                  backgroundColor="gray.100"
                  borderRadius="md"
                  padding={4}
                >
                  {comment.by} | {comment.kids?.length || "0"}{" "}
                  {comment.kids?.length === 1 ? "comment" : "comments"}
                  {" | "}
                  {getRelativeTimeString(comment.time * 1_000)}
                </chakra.summary>
                {/* </summary> */}

                <Box marginX={4} marginY={2}>
                  <Text
                    fontFamily="serif"
                    dangerouslySetInnerHTML={{ __html: comment.text }}
                  ></Text>

                  {comment.kids?.length && renderKids(comment.kids)}
                </Box>
              </chakra.details>
            );
          })}
        </Grid>
      </Container>
    </main>
  );
}
