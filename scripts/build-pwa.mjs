import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const output = resolve("out");
const fixedUrls = [
  "/", "/en/", "/fr/", "/manifest.webmanifest", "/icon.svg", "/apple-icon.png",
  "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png",
  "/fonts/NotoSans-Regular.woff", "/fonts/NotoSans-Semibold.woff",
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return files.flat();
}

const staticFiles = await filesUnder(join(output, "_next", "static"));
const urls = [...new Set([...fixedUrls, ...staticFiles.map((file) => `/${relative(output, file).split(sep).join("/")}`)])].sort();
const hash = createHash("sha256");
for (const url of urls) {
  const assetPath = url === "/" ? "index.html" : url.endsWith("/") ? `${url.slice(1)}index.html` : url.slice(1);
  const path = join(output, assetPath);
  hash.update(url);
  hash.update(await readFile(path));
}

const version = hash.digest("hex").slice(0, 16);
const template = await readFile("scripts/sw-template.js", "utf8");
const worker = template.replace("__BUILD_ID__", version).replace("__PRECACHE_URLS__", JSON.stringify(urls));
if (worker.includes("__BUILD_ID__") || worker.includes("__PRECACHE_URLS__")) throw new Error("Service-worker template was not fully rendered");
await writeFile(join(output, "sw.js"), worker);
console.log(`PWA service worker generated: ${urls.length} static URLs, version ${version}.`);
