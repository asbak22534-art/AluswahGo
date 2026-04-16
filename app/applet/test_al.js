import https from 'https';
https.get('https://api.aladhan.com/v1/gToHCalendar/1/2026', (res) => {
  console.log(res.statusCode);
});
