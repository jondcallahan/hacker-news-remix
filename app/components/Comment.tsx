import { Box, chakra, Text } from "@chakra-ui/react";
import { Item } from "~/utils/api.server";

export function Comment(
  props: {
    comment: Item;
    children?: React.ReactNode;
    boxProps?: React.ComponentProps<typeof Box>;
    originalPoster?: string;
    "data-testid"?: string;
  } & React.ComponentProps<typeof chakra.details>,
) {
  const { comment, children, boxProps, originalPoster, ...rest } = props;

  return (
    <chakra.details
      key={comment.id}
      open
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
        | {Array.isArray(comment.kids) ? comment.kids?.length || "0" : "0"}{" "}
        {Array.isArray(comment.kids) && comment.kids?.length === 1
          ? "comment"
          : "comments"}
        {" | "}
        {comment.relativeTime}
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
