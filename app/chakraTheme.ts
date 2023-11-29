import { extendTheme } from "@chakra-ui/react";

const linkStyles = {
  fontSize: "1.125rem",
  lineHeight: "1.65",
  color: "blue.500",
  _visited: {
    color: "purple.500",
  },
  textDecoration: "underline",
  textDecorationColor: "transparent",
  transition: "text-decoration-color ease-in 0.17s",
  _hover: {
    textDecorationColor: "currentcolor",
  },
};

export const theme = extendTheme({
  fonts: {
    serif: "Vollkorn, Charter, Georgia, serif",
    heading:
      "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    body: "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
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
    Container: {
      baseStyle: {
        paddingX: "initial",
      },
    },
  },
});
