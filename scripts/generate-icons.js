/* eslint-disable import/no-nodejs-modules */
/* eslint-disable no-undef */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

// SVG content for the icon (static version of the Euro loading spinner)
const iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Static Euro symbol with circle for icon use -->
  
  <!-- Outer circle -->
  <circle
    cx="12"
    cy="12"
    r="11"
    fill="none"
    stroke="rgb(14 165 233)"
    stroke-width="1.5"
  />
  
  <!-- Euro symbol paths - centered and scaled -->
  <g transform="scale(0.85) translate(1.8, 1.8)">
    <!-- Top curve of Euro -->
    <path
      d="M18 7c0-5.333-8-5.333-8 0"
      stroke="rgb(14 165 233)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Bottom curve of Euro -->
    <path
      d="M10 7v10c0 5.333 8 5.333 8 0"
      stroke="rgb(14 165 233)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Top horizontal line -->
    <path
      d="M6 10h8"
      stroke="rgb(14 165 233)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Bottom horizontal line -->
    <path
      d="M6 14h8"
      stroke="rgb(14 165 233)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </g>
</svg>`;

// Icon sizes to generate
const iconSizes = [
  { name: "web-app-manifest-192x192.png", size: 192 },
  { name: "web-app-manifest-512x512.png", size: 512 },
  { name: "favicon-96x96.png", size: 96 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateIcons() {
  console.log("Generating icons from Euro loading spinner SVG...");

  // Save the source SVG
  const svgPath = resolve("public", "favicon.svg");
  writeFileSync(svgPath, iconSvg);
  console.log(`✓ Saved source SVG: ${svgPath}`);

  // Generate PNG icons
  for (const { name, size } of iconSizes) {
    const outputPath = resolve("public", name);
    await sharp(Buffer.from(iconSvg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate favicon.ico as a 32x32 PNG
  // Note: Modern browsers accept PNG files with .ico extension
  // For broader compatibility, a proper ICO encoder could be used in the future
  const icoPath = resolve("public", "favicon.ico");
  await sharp(Buffer.from(iconSvg)).resize(32, 32).png().toFile(icoPath);
  console.log("✓ Generated favicon.ico (32x32 PNG)");

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch((error) => {
  console.error("Error generating icons:", error);
  process.exit(1);
});
