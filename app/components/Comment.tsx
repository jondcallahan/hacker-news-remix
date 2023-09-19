import { Box, Text, chakra } from "@chakra-ui/react";
import { Item } from "~/utils/api.server";
import { getRelativeTimeString } from "~/utils/time";

export function Comment(
  props: {
    comment: Item;
    children?: React.ReactNode;
    boxProps?: React.ComponentProps<typeof Box>;
    originalPoster?: string;
    "data-testid"?: string;
  } & React.ComponentProps<typeof chakra.details>
) {
  const { comment, children, boxProps, originalPoster, ...rest } = props;

  return (
    <chakra.details
      key={comment.id}
      onClick={(e) => {
        // close the details element unless the user clicks on a link or summary
        if (
          e.nativeEvent.target.tagName !== "A" &&
          e.nativeEvent.target.tagName !== "SUMMARY"
        ) {
          e.currentTarget.removeAttribute("open");
          e.stopPropagation(); // don't bubble up to the next details
        }
      }}
      open
      cursor="pointer"
      marginTop={2}
      {...rest}
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
        <chakra.span
          // Use a custom color for the original poster
          color={originalPoster === comment.by ? "orange.600" : undefined}
        >
          {comment.by}
        </chakra.span>{" "}
        | {comment.kids?.length || "0"}{" "}
        {comment.kids?.length === 1 ? "comment" : "comments"}
        {" | "}
        {getRelativeTimeString(comment.time * 1_000)}
      </chakra.summary>
      <Box
        {...boxProps}
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
          dangerouslySetInnerHTML={{ __html: comment.text || "" }}
        />
        {children && <Box paddingX={2}>{children}</Box>}
      </Box>
    </chakra.details>
  );
}
