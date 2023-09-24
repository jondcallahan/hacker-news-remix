/** @type {import('@remix-run/dev').AppConfig} */
const config = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "build",
  devServerPort: 8002,
  ignoredRouteFiles: [".*"],
  serverDependenciesToBundle: ["react-tweet/api", "plaiceholder"],
};
export default config;
