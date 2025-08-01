import { Box, chakra, Text } from "@chakra-ui/react";
import { Item } from "~/utils/api.server";
import { haptic } from "ios-haptics";

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

  // Handle clicking on the comment body (not summary)
  const handleClick = (e: React.MouseEvent<HTMLDetailsElement>) => {
    const target = e.nativeEvent.target as HTMLElement;

    // Close the details element unless the user clicks on a link or summary
    if (
      target &&
      target.tagName !== "A" &&
      target.tagName !== "SUMMARY"
    ) {
      haptic.confirm();
      e.currentTarget.removeAttribute("open");
      e.stopPropagation(); // don't bubble up to the next details
    }
  };

  // Handle clicking on the summary (title bar)
  const handleSummaryClick = (e: React.MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.parentElement as HTMLDetailsElement;
    
    if (details && details.tagName === "DETAILS") {
      if (details.open) {
        // Comment is open, will be closed
        haptic.confirm();
      } else {
        // Comment is closed, will be opened
        haptic();
      }
    }
  };

  return (
    <chakra.details
      key={comment.id}
      onClick={handleClick}
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
        onClick={handleSummaryClick}
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
