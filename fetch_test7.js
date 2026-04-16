import https from 'https';
https.get('https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/holidays.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const keys = Object.keys(json);
    const years = [...new Set(keys.map(k => k.substring(0, 4)))];
    console.log("Years:", years);
  });
});
