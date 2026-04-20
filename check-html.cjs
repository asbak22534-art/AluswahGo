const https = require('https');
https.get('https://portal.misitaluswah.sch.id/', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log(html.includes('manifest.webmanifest') ? 'Manifest linked!' : 'Manifest link MISSING!');
    
    // Extrak tag link
    const match = html.match(/<link[^>]*rel="manifest"[^>]*>/i);
    if (match) console.log(match[0]);
  });
});
