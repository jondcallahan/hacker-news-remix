import { unstable_vitePlugin as remix } from "@remix-run/dev";
import morgan from "morgan";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    requestLogger(),
    remix({
      ignoredRouteFiles: [".*"],
      // serverDependenciesToBundle: ["react-tweet/api", "plaiceholder"],
    }),
    tsconfigPaths(),
  ],
});

function requestLogger() {
  return {
    name: "request-logger",
    configureServer(server) {
      return () => {
        server.middlewares.use(morgan("dev"));
      };
    },
  };
}
