const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Colin\\.gemini\\antigravity-ide\\brain\\c690124e-cd2c-48a2-b4a3-0224345c2769';
const destBase = path.join(__dirname, 'assets', 'images');

const charDest = path.join(destBase, 'characters');
const bgDest = path.join(destBase, 'backgrounds');

// Create destination directories if they don't exist
fs.mkdirSync(charDest, { recursive: true });
fs.mkdirSync(bgDest, { recursive: true });

// We define our source images and where they should map
const mappings = [
  // Characters
  { src: 'hiyori_normal_1781970929419.png', dest: path.join(charDest, 'hiyori_normal.png') },
  { src: 'hiyori_smile_1781970941151.png', dest: path.join(charDest, 'hiyori_smile.png') },
  { src: 'hiyori_shy_1781970957239.png', dest: path.join(charDest, 'hiyori_shy.png') },
  // Fallbacks for characters we couldn't generate due to quota
  { src: 'hiyori_normal_1781970929419.png', dest: path.join(charDest, 'hiyori_surprised.png') },
  { src: 'hiyori_shy_1781970957239.png', dest: path.join(charDest, 'hiyori_troubled.png') },

  // Backgrounds
  { src: 'bg_library_1781970975177.png', dest: path.join(bgDest, 'bg_library.png') },
  { src: 'bg_greenhouse_1781971009636.png', dest: path.join(bgDest, 'bg_greenhouse.png') },
  { src: 'bg_classroom_1781971025629.png', dest: path.join(bgDest, 'bg_classroom.png') },
  // Fallbacks for backgrounds we couldn't generate due to quota
  { src: 'bg_classroom_1781971025629.png', dest: path.join(bgDest, 'bg_school_gate_rain.png') }, // Will apply wet/rain CSS filter
  { src: 'bg_greenhouse_1781971009636.png', dest: path.join(bgDest, 'bg_port_sunset.png') }
];

console.log('Copying generated assets...');

let successCount = 0;
mappings.forEach(map => {
  const srcPath = path.join(srcDir, map.src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, map.dest);
    console.log(`Copied: ${map.src} -> ${path.relative(__dirname, map.dest)}`);
    successCount++;
  } else {
    console.error(`Source file not found: ${srcPath}`);
  }
});

console.log(`\nAsset setup complete. Successfully copied ${successCount} files.`);
