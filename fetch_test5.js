import https from 'https';
https.get('https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/holidays.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.substring(0, 500)));
});
