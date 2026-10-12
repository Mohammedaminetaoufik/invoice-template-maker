import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const fonts = [
  ["node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff", "public/fonts/NotoSans-Regular.woff"],
  ["node_modules/@fontsource/noto-sans/files/noto-sans-latin-600-normal.woff", "public/fonts/NotoSans-Semibold.woff"],
];

for (const [sourcePath, targetPath] of fonts) {
  const source = resolve(sourcePath);
  const target = resolve(targetPath);
  if (!existsSync(source)) {
    console.warn(`Noto Sans font asset is not installed: ${sourcePath}`);
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(`Copied PDF font to ${target}`);
}
