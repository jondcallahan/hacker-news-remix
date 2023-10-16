/** @type {import('@remix-run/dev').AppConfig} */
const config = {
  ignoredRouteFiles: [".*"],
  serverDependenciesToBundle: ["react-tweet/api", "plaiceholder"],
};
export default config;
