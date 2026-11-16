import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import type { Plugin } from "vite";

const require = createRequire(import.meta.url);
const sourceDir = dirname(require.resolve("@xeet/core/node"));
const wasmDir = join(sourceDir, "../wasm");
const moduleId = "virtual:xeet-browser";

/** @xeet/core 0.1.0 ships Node bindings only; replace their disk bootstrap for browsers. */
export function xeetBrowser(): Plugin {
  return {
    name: "xeet-browser",
    resolveId(id) {
      if (id === moduleId) return `\0${moduleId}`;
    },
    load(id) {
      if (id !== `\0${moduleId}`) return;
      const source = readFileSync(join(wasmDir, "xeet_wasm.js"), "utf8");
      const bootstrap = source.indexOf("const wasmPath = require('path')");
      if (bootstrap < 0)
        throw new Error("Xeet bindings changed; update the browser bootstrap.");
      const bindings = source
        .slice(0, bootstrap)
        .replace(/^exports\.\w+ = \w+;\n/gm, "");
      const manifest = JSON.parse(
        readFileSync(join(wasmDir, "fonts/packs.json"), "utf8"),
      );
      const names = Object.keys(manifest.packs);
      return `
import { bind } from "@xeet/core";
import { createFontPacks, sha256Hex } from ${JSON.stringify(join(sourceDir, "fonts.js"))};
import wasmUrl from ${JSON.stringify(join(wasmDir, "xeet_wasm_bg.wasm") + "?url")};
${names.map((name, index) => `import font${index} from ${JSON.stringify(join(wasmDir, `fonts/${name}.bin`) + "?url")};`).join("\n")}
const fontUrls = {${names.map((name, index) => `${JSON.stringify(name)}: font${index}`).join(",")}};
${bindings}
let wasm;
let pending;
async function initialize() {
  const response = await fetch(wasmUrl);
  if (!response.ok) throw new Error("Failed to load Xeet WebAssembly");
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), __wbg_get_imports());
  wasm = instance.exports;
  wasm.__wbindgen_start();
  const fonts = createFontPacks({
    manifest: ${JSON.stringify(manifest)},
    read: async name => {
      const response = await fetch(fontUrls[name]);
      if (!response.ok) throw new Error("Failed to load Xeet font pack");
      return new Uint8Array(await response.arrayBuffer());
    },
    hash: sha256Hex,
    register: register_font,
    missingPacks: missing_packs,
  });
  return { renderer: bind({ call, upstream_version }), fonts };
}
export async function renderPost(post, options) {
  const { renderer, fonts } = await (pending ??= initialize().catch(error => { pending = undefined; throw error; }));
  await fonts.ensure({ post, options });
  return renderer.render(post, options);
}
`;
    },
  };
}
