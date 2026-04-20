const https = require('https');
https.get('https://portal.misitaluswah.sch.id/OneSignalSDKWorker.js', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(body.includes('workbox') ? 'Has Workbox' : 'No Workbox');
    console.log(body.includes('importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js")') ? 'Has OneSignal' : 'No OneSignal');
    console.log('HTTP Status:', res.statusCode);
  });
});
