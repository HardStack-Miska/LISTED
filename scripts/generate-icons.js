#!/usr/bin/env node

/**
 * Icon generator for LISTED app.
 *
 * Usage:
 *   node scripts/generate-icons.js
 *
 * Requires: sharp (npm install --save-dev sharp)
 *
 * Generates:
 *   - assets/icon.png           (1024x1024)
 *   - assets/adaptive-icon.png  (1024x1024, foreground only)
 *   - assets/splash-icon.png    (288x288)
 *   - assets/favicon.png        (48x48)
 *   - assets/notification-icon.png (96x96, white on transparent)
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error(
      'sharp is not installed. Run: npm install --save-dev sharp',
    );
    console.log('\nAlternative: create icons manually with these specs:');
    console.log('  icon.png           — 1024x1024, app icon');
    console.log('  adaptive-icon.png  — 1024x1024, foreground for Android adaptive');
    console.log('  splash-icon.png    — 288x288, splash screen logo');
    console.log('  favicon.png        — 48x48, web favicon');
    console.log('  notification-icon.png — 96x96, white silhouette on transparent bg');
    process.exit(1);
  }

  const assetsDir = path.join(__dirname, '..', 'assets');

  // Create a simple "L" checkmark icon SVG
  const createIconSvg = (size, bgColor, fgColor, padding = 0) => {
    const innerSize = size - padding * 2;
    const cx = size / 2;
    const cy = size / 2;
    const r = innerSize * 0.42;
    // Checkmark path scaled to icon
    const checkScale = innerSize * 0.006;
    const checkX = cx - innerSize * 0.18;
    const checkY = cy - innerSize * 0.02;

    return Buffer.from(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${bgColor !== 'none' ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bgColor}"/>` : ''}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fgColor}" opacity="0.15"/>
        <g transform="translate(${checkX}, ${checkY}) scale(${checkScale})">
          <path d="M10 50 L35 75 L75 25" stroke="${fgColor}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <text x="${cx}" y="${cy + innerSize * 0.32}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="${innerSize * 0.28}" fill="${fgColor}">LISTED</text>
      </svg>
    `);
  };

  const icons = [
    {
      name: 'icon.png',
      size: 1024,
      svg: createIconSvg(1024, '#dc4c3e', '#ffffff'),
    },
    {
      name: 'adaptive-icon.png',
      size: 1024,
      svg: createIconSvg(1024, '#dc4c3e', '#ffffff', 120),
    },
    {
      name: 'splash-icon.png',
      size: 288,
      svg: createIconSvg(288, 'none', '#dc4c3e'),
    },
    {
      name: 'favicon.png',
      size: 48,
      svg: createIconSvg(48, '#dc4c3e', '#ffffff'),
    },
    {
      name: 'notification-icon.png',
      size: 96,
      svg: createIconSvg(96, 'none', '#ffffff'),
    },
  ];

  for (const icon of icons) {
    const outputPath = path.join(assetsDir, icon.name);
    await sharp(icon.svg)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
  }

  console.log('\nDone! Replace SVGs with your designer\'s icons when ready.');
}

generateIcons().catch(console.error);
