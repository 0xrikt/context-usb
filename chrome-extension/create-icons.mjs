// Generate simple extension icons
// Run with: node create-icons.mjs

import { writeFileSync } from "fs";

// Create a simple SVG icon and convert to PNG via data URL
// For now, generate placeholder SVG icons
function createSvgIcon(size) {
  const padding = Math.round(size * 0.15);
  const iconSize = size - padding * 2;
  const strokeWidth = Math.max(1, Math.round(size / 16));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#000"/>
  <g transform="translate(${padding}, ${padding})" stroke="#fff" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${svgUsbPath(iconSize)}"/>
  </g>
</svg>`;
}

function svgUsbPath(s) {
  const cx = s / 2;
  const top = s * 0.15;
  const bot = s * 0.85;
  const left = s * 0.2;
  const right = s * 0.8;
  const mid = s * 0.45;

  return [
    `M ${cx} ${top} L ${cx} ${bot}`,
    `M ${left} ${bot} L ${left} ${mid} A ${s * 0.15} ${s * 0.15} 0 0 1 ${left + s * 0.15} ${mid - s * 0.15}`,
    `M ${right} ${bot} L ${right} ${mid} A ${s * 0.15} ${s * 0.15} 0 0 0 ${right - s * 0.15} ${mid - s * 0.15}`,
  ].join(" ");
}

// Write SVG files (Chrome actually accepts SVG in some contexts,
// but for full compatibility, we'll note these need PNG conversion)
const sizes = [16, 48, 128];

for (const size of sizes) {
  const svg = createSvgIcon(size);
  writeFileSync(`icons/icon-${size}.svg`, svg);
  console.log(`Created icons/icon-${size}.svg`);
}

console.log("\nNote: For Chrome Web Store, convert SVGs to PNGs.");
console.log("For development/testing, Chrome accepts SVGs in the icons directory.");
