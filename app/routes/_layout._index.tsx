import { useEffect, useRef, useState } from "react";
import {
  Link as RouterLink,
  useLoaderData,
  useNavigate,
  NavLink,
} from "react-router";
import type { Item } from "~/utils/api.server";
import { haptic } from "ios-haptics";
import { getTopStories } from "~/utils/api.server";
import {
  Box,
  Grid,
  Heading,
  Text,
  Link as ChakraLink,
  Flex,
  Image,
  chakra,
  Tag,
  TagLeftIcon,
  TagLabel,
  Code,
} from "@chakra-ui/react";
import { useHotkeys } from "react-hotkeys-hook";

export async function loader() {
  const timerStart = process.hrtime();

  const storiesPerPage = 30;
  const allStories = (await getTopStories(storiesPerPage)) ?? [];
  const stories = allStories.filter((story): story is Item => story != null);

  // Log the time it took to get the value in ms
  const timerEnd = process.hrtime(timerStart);
  console.log(`topstories took ${timerEnd[0] * 1e3 + timerEnd[1] / 1e6}ms`);

  return { allStories: stories };
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Box>
      <Text>Something went wrong</Text>
      <Code colorScheme="red">{error?.message || "Unknown error"}</Code>
    </Box>
  );
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const stories = data?.allStories ?? [];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedIndex !== null && cardRefs.current[selectedIndex]) {
      cardRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedIndex]);

  // j - move down to next story
  useHotkeys(
    "j",
    () => {
      setSelectedIndex((prev) => {
        if (prev === null) return 0;
        return Math.min(prev + 1, stories.length - 1);
      });
    },
    { preventDefault: true }
  );

  // k - move up to previous story
  useHotkeys(
    "k",
    () => {
      setSelectedIndex((prev) => {
        if (prev === null) return stories.length - 1;
        return Math.max(prev - 1, 0);
      });
    },
    { preventDefault: true }
  );

  // c - go to comments for selected story
  useHotkeys(
    "c",
    () => {
      if (selectedIndex !== null && stories[selectedIndex]) {
        haptic();
        navigate(`/item/${stories[selectedIndex].id}`, {
          viewTransition: true,
        });
      }
    },
    { preventDefault: true },
    [selectedIndex, stories]
  );

  // Enter - open story URL (or comments if no URL)
  useHotkeys(
    "enter",
    () => {
      if (selectedIndex !== null && stories[selectedIndex]) {
        const story = stories[selectedIndex];
        haptic();
        if (story.url) {
          window.open(story.url, "_blank");
        } else {
          navigate(`/item/${story.id}`, { viewTransition: true });
        }
      }
    },
    { preventDefault: true },
    [selectedIndex, stories]
  );

  // Escape - clear selection
  useHotkeys(
    "escape",
    () => {
      setSelectedIndex(null);
    },
    { preventDefault: true }
  );

  return (
    <>
      <Flex wrap="wrap" gap="4" justifyContent="center">
        {stories.map((story, index) => {
          let storyUrl;
          if (story.url) storyUrl = new URL(story.url);
          const isSelected = selectedIndex === index;

          return (
            <Box
              key={story.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              borderRadius="lg"
              display={"grid"}
              _hover={{
                boxShadow: "lg",
              }}
              transition="all 0.2s ease-in-out"
              backgroundColor="orange.50"
              padding="4"
              width="full"
              outline={isSelected ? "3px solid" : "none"}
              outlineColor={isSelected ? "blue.500" : "transparent"}
              outlineOffset="2px"
              boxShadow={isSelected ? "lg" : "none"}
              onClick={() => setSelectedIndex(index)}
              cursor="pointer"
              tabIndex={0}
              onFocus={() => setSelectedIndex(index)}
              data-story-card
            >
              <Grid gap="2">
                {story.url && (
                  <Flex alignItems="center">
                    <Image
                      src={`https://icons.duckduckgo.com/ip3/${storyUrl?.hostname}.ico`}
                      boxSize="4"
                      marginRight="2"
                      alt={`Icon for ${storyUrl?.hostname}`}
                      color="transparent" // Hide the alt text when the image is unavailable
                    />
                    <Text wordBreak="break-all">
                      {storyUrl?.hostname?.replace("www.", "")}
                    </Text>
                  </Flex>
                )}
                <RouterLink to={story.url || `/item/${story.id}`}>
                  <Heading
                    size="md"
                    scrollMarginY="64px"
                    data-link-type="story"
                  >
                    {story.title}
                  </Heading>
                </RouterLink>

                <Text>
                  By {story.by} {story.relativeTime}
                </Text>

                <ChakraLink
                  as={NavLink}
                  to={`/item/${story.id}`}
                  prefetch="intent"
                  width="full"
                  display="flex"
                  justifyContent="space-between"
                  gap="2"
                  role="group"
                  _hover={{
                    textDecoration: "none",
                  }}
                  aria-label={`View comments for ${story.title}`}
                  viewTransition
                  onClick={() => haptic()}
                >
                  <Tag size="lg">
                    <TagLeftIcon
                      as={() => (
                        <chakra.svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          boxSize="5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 11l5-5m0 0l5 5m-5-5v12"
                          />
                        </chakra.svg>
                      )}
                    />
                    <TagLabel>{story.score} points </TagLabel>
                  </Tag>
                  <Tag
                    colorScheme="blue"
                    borderWidth="2px"
                    borderColor="transparent"
                    size="lg"
                    transition="border-color ease-in 0.17s"
                    _groupHover={{
                      borderStyle: "solid",
                      borderColor: "blue.500",
                    }}
                    sx={{
                      "a:visited &": {
                        color: "purple.500",
                      },
                    }}
                  >
                    <TagLeftIcon
                      as={() => (
                        <chakra.svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          boxSize="4"
                          display="inline"
                          verticalAlign="text-top"
                          marginInlineEnd={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </chakra.svg>
                      )}
                    />
                    <TagLabel>
                      {story.descendants || "0"}{" "}
                      {story.descendants === 1 ? "comment" : "comments"}
                    </TagLabel>
                  </Tag>
                </ChakraLink>
              </Grid>
            </Box>
          );
        })}
      </Flex>
    </>
  );
}
