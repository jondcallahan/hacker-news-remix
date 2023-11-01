import { unstable_vitePlugin as remix } from "@remix-run/dev";
import morgan from "morgan";
import { defineConfig, type ViteDevServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    requestLogger(),
    remix({
      ignoredRouteFiles: [".*"],
    }),
    tsconfigPaths(),
  ],
});

function requestLogger() {
  return {
    name: "request-logger",
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(morgan("dev"));
      };
    },
  };
}
