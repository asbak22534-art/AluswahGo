import https from 'https';
https.get('https://date.nager.at/api/v3/PublicHolidays/2024/ID', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
