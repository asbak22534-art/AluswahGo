const fs = require('fs');
fs.copyFileSync('public/pwa-192x192.png', 'public/maskable-icon-192x192.png');
console.log('Copied pwa-192x192.png to maskable-icon-192x192.png');
