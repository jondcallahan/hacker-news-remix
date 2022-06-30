import { extendTheme } from "@chakra-ui/react";

const linkStyles = {
  fontSize: "1.125rem",
  lineHeight: "1.65",
  color: "blue.500",
  _visited: {
    color: "purple.500",
  },
  _hover: {
    textDecoration: "underline",
  },
};

export const theme = extendTheme({
  fonts: {
    serif: "Charter, Georgia, serif",
  },
  styles: {
    global: {
      a: linkStyles,
      html: {
        height: "100%",
      },
      body: {
        minHeight: "100%",
        backgroundColor: "orange.100",
      },
      pre: {
        whiteSpace: "pre-wrap",
      },
    },
  },
  components: {
    Text: {
      baseStyle: {
        fontSize: "1.125rem",
        lineHeight: "1.65",
      },
    },
    Link: {
      baseStyle: linkStyles,
    },
  },
});
