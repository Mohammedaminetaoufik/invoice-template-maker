// Local-only QA server for the exact Cloudflare static export, not a production runtime.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".woff": "font/woff", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain" };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    res.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", ...(pathname === "/sw.js" ? { "Cache-Control": "no-cache, no-store, must-revalidate" } : {}) });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end("Not found"); }
}).listen(4137, "127.0.0.1", () => console.log("Static QA export: http://127.0.0.1:4137"));
