const https = require('https');
https.get('https://portal.misitaluswah.sch.id/manifest.webmanifest', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      JSON.parse(body);
      console.log('Valid JSON:', body);
    } catch(e) {
      console.log('INVALID JSON:', e.message);
    }
  });
});
