import { json, LinksFunction, LoaderFunction } from "@remix-run/node";
import {
  Link as RemixLink,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { getItem, getTopStories } from "~/utils/api.server";
import { getRelativeTimeString } from "~/utils/time";
import {
  Box,
  Grid,
  Heading,
  Text,
  Link as ChakraLink,
  Stat,
  StatNumber,
  Container,
} from "@chakra-ui/react";

type StoryType = {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const storiesPerPage = 30;
  const allStoryIds = await getTopStories(storiesPerPage);

  const allStories = await Promise.all(
    allStoryIds.slice(0, storiesPerPage).map(async (id) => {
      return await getItem(id);
    })
  );

  return json({ allStories });
};

export default function Index() {
  const data = useLoaderData();
  const navigate = useNavigate();

  return (
    <Container>
      <Grid gap="4" justifyContent="center">
        {data?.allStories.map((story: StoryType) => {
          return (
            <Box
              key={story.id}
              borderWidth="1px"
              borderStyle="solid"
              borderColor="gray.100"
              borderRadius="lg"
              display={"grid"}
              gridTemplateColumns="70px 1fr"
              _hover={{
                boxShadow: "lg",
              }}
              transition="box-shadow 0.2s ease-in-out"
              backgroundColor="white"
              padding="2"
            >
              <Grid placeContent="center">
                <Stat>
                  <StatNumber>{story.score}</StatNumber>
                </Stat>
              </Grid>
              <Grid gap="1">
                <Heading
                  size="md"
                  as="a"
                  scrollMarginY={12}
                  href={story.url || `/item/${story.id}`}
                  onKeyPress={(e) => {
                    // J key will advance to the next story
                    // K will go to previous
                    // C will go to comments
                    if (e.key === "j") {
                      try {
                        document
                          .querySelectorAll<HTMLAnchorElement>(
                            "a[data-link-type=story]"
                          )
                          .forEach((val, idx, list) => {
                            if (val === document.activeElement) {
                              list[idx + 1].focus();
                              e.stopPropagation(); // Stop propogation so the listener on the <body> doesn't pick up the event
                              throw "stop"; // Using a throw to break the forEach loop
                            }
                          });
                      } catch {}
                    } else if (e.key === "k") {
                      // Go to previous story or last if on first
                      try {
                        document
                          .querySelectorAll<HTMLAnchorElement>(
                            "a[data-link-type=story]"
                          )
                          .forEach((val, idx, list) => {
                            if (val === document.activeElement) {
                              if (idx === 0) {
                                list[list.length - 1].focus();
                              } else {
                                list[idx - 1].focus();
                              }

                              throw "stop"; // Using a throw to break the forEach loop
                            }
                          });
                      } catch {}
                    } else if (e.key === "c") {
                      navigate(`/item/${story.id}`);
                    }
                  }}
                  data-link-type="story"
                >
                  {story.title}
                </Heading>

                {story.url && <Text>{new URL(story.url)?.hostname}</Text>}

                <Text>
                  By {story.by} {getRelativeTimeString(story.time * 1_000)}
                </Text>

                <ChakraLink
                  as={RemixLink}
                  to={`/item/${story.id}`}
                  prefetch="intent"
                  width="full"
                  display="inline-block"
                >
                  {story.descendants || "0"} Comments
                </ChakraLink>
              </Grid>
            </Box>
          );
        })}
      </Grid>
    </Container>
  );
}
