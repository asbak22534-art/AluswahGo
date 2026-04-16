import https from 'https';
https.get('https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/holidays.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const keys = Object.keys(json);
    console.log("Total keys:", keys.length);
    console.log("Sample 2024:", keys.filter(k => k.startsWith('2024')).slice(0, 3));
    console.log("Sample 2025:", keys.filter(k => k.startsWith('2025')).slice(0, 3));
  });
});
