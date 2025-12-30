import {
  Box,
  Heading,
  Img,
  Text,
  Flex,
  Icon,
  Avatar,
  AvatarBadge,
  chakra,
} from "@chakra-ui/react";
import type { Tweet } from "react-tweet/api";
import type { GetPlaiceholderReturn } from "plaiceholder";
import { getOGImagePlaceholderContent } from "~/utils/getOGImagePlaceholderContent";
import { Item } from "~/utils/api.server";
import { formatDate } from "~/utils/time";

const getBackgroundImage = (text: string) => {
  return `url("data:image/svg+xml;base64,${btoa(
    getOGImagePlaceholderContent(text)
  )}")`;
};

function TweetEmbed({ tweet }: { tweet: Tweet }) {
  const friendlyDate = formatDate(new Date(tweet.created_at));
  const friendlyText = tweet.text;
  const handle = tweet.user.name;
  const likeCount = tweet.favorite_count;
  const retweetCount = tweet.conversation_count;
  const hasImage = !!tweet.mediaDetails;
  const avatar = tweet.user.profile_image_url_https;
  const isVerified = tweet.user.is_blue_verified || tweet.user.verified;

  function formatNumber(num: number) {
    if (num > 999) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num;
  }

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      width="full"
      height={["150px", "300px"]}
      objectFit="cover"
      bg="white"
      color="twitter.600"
    >
      <Flex direction="column" justify={"center"} height="full" px={4} gap={[0.5, 1]}>
        <Flex alignItems="center" gap="2">
          <Avatar src={avatar} name={handle} size="sm">
            {isVerified && <AvatarBadge boxSize="1em" bgColor="twitter.500" />}
          </Avatar>
          <Text fontWeight="bold">{handle}</Text>
        </Flex>
        <Heading
          size={["xs", "md"]}
          lineHeight="shorter"
          noOfLines={[3, 4]}
          overflow="hidden"
        >
          {friendlyText}
        </Heading>
        {hasImage && (
          <Flex alignItems="center" gap="2" display={["none", "flex"]}>
            <Icon
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              boxSize={4}
            >
              <path
                fillRule="evenodd"
                d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </Icon>
            <Text fontSize="sm">Photo attached</Text>
          </Flex>
        )}
        <Flex alignItems="center" gap="2" display={["none", "flex"]}>
          <Flex alignItems="center" gap="2">
            <Icon viewBox="0 0 20 20" fill="red.500" boxSize={5}>
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
            </Icon>
            <Text>{formatNumber(likeCount)}</Text>
          </Flex>
          <Flex alignItems="center" gap="2">
            <Icon viewBox="0 0 20 20" fill="green.400" boxSize={5}>
              <path
                fillRule="evenodd"
                d="M10 4.5c1.215 0 2.417.055 3.604.162a.68.68 0 01.615.597c.124 1.038.208 2.088.25 3.15l-1.689-1.69a.75.75 0 00-1.06 1.061l2.999 3a.75.75 0 001.06 0l3.001-3a.75.75 0 10-1.06-1.06l-1.748 1.747a41.31 41.31 0 00-.264-3.386 2.18 2.18 0 00-1.97-1.913 41.512 41.512 0 00-7.477 0 2.18 2.18 0 00-1.969 1.913 41.16 41.16 0 00-.16 1.61.75.75 0 101.495.12c.041-.52.093-1.038.154-1.552a.68.68 0 01.615-.597A40.012 40.012 0 0110 4.5zM5.281 9.22a.75.75 0 00-1.06 0l-3.001 3a.75.75 0 101.06 1.06l1.748-1.747c.042 1.141.13 2.27.264 3.386a2.18 2.18 0 001.97 1.913 41.533 41.533 0 007.477 0 2.18 2.18 0 001.969-1.913c.064-.534.117-1.071.16-1.61a.75.75 0 10-1.495-.12c-.041.52-.093 1.037-.154 1.552a.68.68 0 01-.615.597 40.013 40.013 0 01-7.208 0 .68.68 0 01-.615-.597 39.785 39.785 0 01-.25-3.15l1.689 1.69a.75.75 0 001.06-1.061l-2.999-3z"
                clipRule="evenodd"
              />
            </Icon>
            <Text>{formatNumber(retweetCount)}</Text>
          </Flex>
        </Flex>
        <Flex alignItems="center" gap="2">
          <Icon viewBox="0 0 20 20" boxSize={4} fill="twitter.600">
            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.615 11.615 0 006.29 1.84" />
          </Icon>
          <Text>{friendlyDate}</Text>
        </Flex>
      </Flex>
    </Box>
  );
}

export default function HeroImage({
  story,
  OGImagePlaceholder,
  tweet,
}: {
  story: Item;
  OGImagePlaceholder: GetPlaiceholderReturn | null;
  tweet: Tweet | undefined;
}) {
  const storyUrl = story.url ?? "https://news.ycombinator.com";

  if (tweet && Object.keys(tweet).length > 0) {
    return <TweetEmbed tweet={tweet} />;
  }

  return (
    <>
      <Img
        height="100%"
        width="100%"
        objectFit="cover"
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundImage={`data:image/svg+xml;base64,${btoa(
          getOGImagePlaceholderContent(new URL(storyUrl).hostname)
        )}`}
      />
      <chakra.iframe
        src={`/api/ogImage-frame?url=${storyUrl}`}
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        width="full"
        height={["150px", "300px"]}
        objectFit="cover"
        background="transparent"
      />
    </>
  );
}
