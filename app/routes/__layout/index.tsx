import { json, LoaderFunction } from "@remix-run/node";
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
  Flex,
  Image,
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
  const timerStart = process.hrtime();

  const storiesPerPage = 30;
  const allStories = await getTopStories(storiesPerPage);

  // Log the time it took to get the value in ms
  const timerEnd = process.hrtime(timerStart);
  console.log(`topstories took ${timerEnd[0] * 1e3 + timerEnd[1] / 1e6}ms`);

  return json({ allStories: allStories });
};

export default function Index() {
  const data = useLoaderData();
  const navigate = useNavigate();

  return (
    <Container>
      <Flex wrap="wrap" gap="4" justifyContent="center">
        {data?.allStories.map((story: StoryType) => {
          return (
            <Box
              key={story.id}
              borderRadius="lg"
              display={"grid"}
              gridTemplateColumns="70px 1fr"
              _hover={{
                boxShadow: "lg",
              }}
              transition="box-shadow 0.2s ease-in-out"
              backgroundColor="orange.50"
              padding="2"
              width="full"
            >
              <Grid placeContent="center">
                <Stat>
                  <StatNumber fontSize="xl">{story.score}</StatNumber>
                </Stat>
              </Grid>
              <Grid gap="1">
                {story.url && (
                  <Flex alignItems="center">
                    <Image
                      src={`https://icons.duckduckgo.com/ip3/${
                        new URL(story.url)?.hostname
                      }.ico`}
                      boxSize="4"
                      marginRight="2"
                    />
                    <Text wordBreak="break-all">
                      {new URL(story.url)?.hostname?.replace("www.", "")}
                    </Text>
                  </Flex>
                )}
                <Heading
                  size="md"
                  as="a"
                  scrollMarginY="64px"
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
      </Flex>
    </Container>
  );
}
