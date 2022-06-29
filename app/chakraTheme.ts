import { extendTheme } from "@chakra-ui/react";

const linkStyles = {
  color: "blue.500",
  _visited: {
    color: "purple.500",
  },
  _hover: {
    textDecoration: "underline",
  },
};

export const theme = extendTheme({
  styles: {
    global: {
      a: linkStyles,
      html: {
        height: "100%",
      },
      body: {
        minHeight: "100%",
        backgroundColor: "gray.50",
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
