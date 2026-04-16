import https from 'https';
https.get('https://api.aladhan.com/v1/gToHCalendar/2026', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(json.code, json.status);
    if (json.data) {
      console.log(Object.keys(json.data));
    }
  });
});
