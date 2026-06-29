import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const svg = readFileSync(resolve(root, "assets/kefoo-icon.svg"));

const outputs = [
  { path: "app/icon.png", size: 32 },
  { path: "app/apple-icon.png", size: 180 },
  { path: "public/favicon-16x16.png", size: 16 },
  { path: "public/favicon-32x32.png", size: 32 },
  { path: "public/favicon-48x48.png", size: 48 },
];

for (const { path, size } of outputs) {
  const buffer = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(resolve(root, path), buffer);
  console.log(`Wrote ${path} (${size}x${size})`);
}
