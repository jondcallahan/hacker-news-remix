import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Grid,
  Heading,
  Link as ChakraLink,
  Progress,
} from "@chakra-ui/react";
import {
  Link as RemixLink,
  Outlet,
  useMatches,
  useTransition,
} from "@remix-run/react";

export default function Layout() {
  const matches = useMatches();
  const transition = useTransition();
  return (
    <>
      <Box
        as="nav"
        backgroundColor="orange.400"
        width="full"
        position="sticky"
        top={0}
        zIndex="sticky"
      >
        <Box
          maxWidth="6xl"
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
                          alignItems="flex-end"
                          gap="1"
                          color={"white"}
                        >
                          {data.story.title}{" "}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            height={20}
                            width={20}
                            fill="currentColor"
                          >
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
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
        <Progress
          size="xs"
          colorScheme="orange"
          isIndeterminate
          visibility={transition.state === "idle" ? "hidden" : "visible"}
        />
      </Box>

      <Box as="main" paddingY="4">
        <Box
          as="section"
          maxWidth="6xl"
          marginX="auto"
          paddingX={{ base: 4, sm: 6, lg: 8 }}
        >
          <Outlet />
        </Box>
      </Box>
    </>
  );
}
