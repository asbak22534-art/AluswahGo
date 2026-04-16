const https = require('https');
https.get('https://raw.githubusercontent.com/guangrei/Json-Indonesia-holidays/master/calendar.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.substring(0, 500)));
});
