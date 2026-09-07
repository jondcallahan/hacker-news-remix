import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (process.env.NODE_ENV !== "production") {
  throw new Error("Run this check with NODE_ENV=production.");
}

// Import the emitted bundles with Bun itself, without Vite's resolver. This
// catches runtime-specific missing exports that a successful build can miss.
const directory = resolve("build/server");
const entries = await readdir(directory, { withFileTypes: true });
const bundles = entries.filter((entry) => entry.isDirectory());
if (!bundles.length) throw new Error("No production server bundles found.");

for (const bundle of bundles) {
  const url = pathToFileURL(resolve(directory, bundle.name, "index.js"));
  const server = await import(url.href);
  if (typeof server.entry?.module?.default !== "function") {
    throw new Error(`Missing request handler in ${bundle.name}`);
  }
  console.log(`Production bundle loaded: ${bundle.name}`);
}
