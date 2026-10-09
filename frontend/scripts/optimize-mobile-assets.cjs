// Non-destructive resized variants; preserve the original design assets.
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const assets = [['logo', 256], ['player_card', 640], ['landing_page_playercard', 900], ['home_page_bg', 900], ['landing_page_bg', 900]];
(async () => {
  for (const [name, width] of assets) {
    const source = path.join(__dirname, '../public', name + '.webp');
    const target = path.join(__dirname, '../public', name + '.mobile.webp');
    await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 85, effort: 6 }).toFile(target);
    console.log(`${name}: ${fs.statSync(source).size} -> ${fs.statSync(target).size} bytes`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
