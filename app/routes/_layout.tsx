import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  Link as ChakraLink,
  Progress,
  Container,
  Text,
} from "@chakra-ui/react";
import {
  Link as RemixLink,
  NavLink,
  Outlet,
  useMatches,
  useNavigation,
} from "@remix-run/react";

export default function Layout() {
  const matches = useMatches();
  const navigation = useNavigation();

  return (
    <>
      <Box as="nav" backgroundColor="orange.400" width="full">
        <Box
          maxWidth="min(100vw, 72rem)"
          marginX="auto"
          paddingX={{ base: 4, sm: 6, lg: 8 }}
          paddingY="4"
        >
          <Heading fontSize="xl" fontWeight="black">
            <Breadcrumb as="section" colorScheme="white">
              <BreadcrumbItem>
                <BreadcrumbLink
                  as={RemixLink}
                  to="/"
                  color={"white"}
                  _visited={{ color: "white" }}
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              {matches.map(({ data, handle }) => {
                if (handle?.showBreadcrumb) {
                  return (
                    <BreadcrumbItem key={data.story.id}>
                      {data.story.url ? (
                        <BreadcrumbLink
                          href={data.story.url}
                          as={ChakraLink}
                          isExternal
                          display="flex"
                          alignItems="center"
                          gap="1"
                          color={"white"}
                          _visited={{ color: "white" }}
                        >
                          {data.story.title} ↗
                        </BreadcrumbLink>
                      ) : (
                        <>{data.story.title}</>
                      )}
                    </BreadcrumbItem>
                  );
                }
              })}
            </Breadcrumb>
          </Heading>
        </Box>
      </Box>
      <Progress
        size="xs"
        colorScheme="orange"
        isIndeterminate
        visibility={navigation.state === "idle" ? "hidden" : "visible"}
        position="sticky"
        top={0}
        zIndex="sticky"
      />

      <Box
        as="main"
        marginTop="8"
        marginBottom="9" // The progress bar is 4px tall so add 1 to the bottom padding
        maxWidth="min(100vw, 72rem)"
        marginX="auto"
        paddingX={{ base: 4, sm: 6, lg: 8 }}
      >
        <Container
          width={{
            base: "full",
            md: "prose",
          }}
        >
          <Outlet />
        </Container>
      </Box>
      <Box as="footer" width="full" backgroundColor="orange.400">
        <Box
          maxWidth="min(100vw, 72rem)"
          marginX="auto"
          paddingX={{ base: 4, sm: 6, lg: 8 }}
          paddingY="4"
        >
          <NavLink to="/">
            <Heading fontSize="xl" fontWeight="black" color="white">
              Home
            </Heading>
          </NavLink>
          <Text color="white">
            All content comes from{" "}
            <ChakraLink href="https://news.ycombinator.com" isExternal>
              Hacker News ↗
            </ChakraLink>
            .
          </Text>
          <Text color="white">
            Please enjoy{" "}
            <ChakraLink href="https://joncallahan.com" isExternal>
              my ↗
            </ChakraLink>{" "}
            reader. Front page intentionally limited to top 30 stories. Get back
            to work.
          </Text>
        </Box>
      </Box>
    </>
  );
}
