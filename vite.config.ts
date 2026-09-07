import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import morgan from "morgan";
import { defineConfig, type ViteDevServer } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), requestLogger(), reactRouter()],
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
