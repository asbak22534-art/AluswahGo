const https = require('https');
https.get('https://portal.misitaluswah.sch.id/', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log(html.includes('serviceWorker.register') ? 'SW inline script found' : 'SW inline script MISSING!');
  });
});
