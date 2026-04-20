const https = require('https');
https.get('https://portal.misitaluswah.sch.id/pwa-512x512.png', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  res.on('data', (d) => {
    console.log('Data preview:', d.toString().substring(0, 50));
    process.exit(0);
  });
});
