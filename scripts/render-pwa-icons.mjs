// Run manually after changing public/icon.svg. The generated PNGs are committed assets.
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const mark = await readFile("public/icon.svg");
const maskable = await readFile("public/icons/maskable-source.svg");

await Promise.all([
  sharp(mark).resize(192, 192).flatten({ background: "#184c49" }).png().toFile("public/icons/icon-192.png"),
  sharp(mark).resize(512, 512).flatten({ background: "#184c49" }).png().toFile("public/icons/icon-512.png"),
  sharp(maskable).png().toFile("public/icons/icon-maskable-512.png"),
  sharp(mark).resize(180, 180).flatten({ background: "#184c49" }).png().toFile("app/apple-icon.png"),
]);

console.log("Rendered 192px, 512px, maskable and Apple touch icons from the SVG brand mark.");
