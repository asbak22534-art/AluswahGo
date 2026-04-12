const https = require('https');

https.get('https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec?action=getHomeData', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.data.review).substring(0, 500));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
