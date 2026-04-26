const fs = require('fs');
const files = [
  'public/logo.png',
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/maskable-icon-192x192.png',
  'public/maskable-icon-512x512.png'
];

files.forEach(f => {
  try {
    const buf = fs.readFileSync(f);
    console.log(`${f}: size=${buf.length}, header=${buf.slice(0, 8).toString('hex')}`);
  } catch (e) {
    console.log(`${f}: error`);
  }
});
