import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

/** A document with a check mark; `padding` shrinks the glyph for maskable icons. */
const iconSvg = (padding: number, rounded: boolean): string => {
  const scale = 1 - padding * 2;
  const offset = 512 * padding;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="#2f6fed"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <rect x="136" y="96" width="240" height="320" rx="28" fill="#ffffff"/>
    <rect x="176" y="150" width="160" height="22" rx="11" fill="#c9d8fb"/>
    <rect x="176" y="196" width="120" height="22" rx="11" fill="#c9d8fb"/>
    <path d="M190 300l44 44 92-100" fill="none" stroke="#2f6fed" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
};

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const standard = iconSvg(0, true);
  writeFileSync(join(outDir, 'icon.svg'), standard);
  const square = Buffer.from(iconSvg(0.06, false));
  const maskable = Buffer.from(iconSvg(0.12, false));
  await sharp(Buffer.from(standard)).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'));
  await sharp(Buffer.from(standard)).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'));
  await sharp(maskable).resize(512, 512).png().toFile(join(outDir, 'icon-512-maskable.png'));
  // iOS applies its own rounded mask, so the touch icon is a full square.
  await sharp(square).resize(180, 180).png().toFile(join(outDir, 'apple-touch-icon.png'));
  console.log(`[icons] written to ${outDir}`);
}

void main();
