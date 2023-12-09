import { unstable_vitePlugin as remix } from "@remix-run/dev";
import morgan from "morgan";
import { defineConfig, type ViteDevServer } from "vite";

export default defineConfig({
  plugins: [requestLogger(), remix()],
  optimizeDeps: {
    exclude: ["sharp"],
  },
  resolve: {
    alias: {
      "~": "/app",
    },
  },
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
