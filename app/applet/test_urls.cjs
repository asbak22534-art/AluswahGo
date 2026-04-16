const https = require('https');

const checkUrl = (url) => {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => resolve({ url, error: e.message }));
  });
};

const run = async () => {
  const urls = [
    'https://api.aladhan.com/v1/gToHCalendar/2026',
    'https://api.aladhan.com/v1/gToHCalendarByYear/2026',
    'https://api.aladhan.com/v1/gToHCalendarByYear?year=2026',
    'https://api.aladhan.com/v1/gToHCalendar?year=2026',
    'https://api.aladhan.com/v1/gToH/calendar/2026',
    'https://api.aladhan.com/v1/calendar/2026',
    'https://api.aladhan.com/v1/hijriCalendar/2026',
    'https://api.aladhan.com/v1/hijriCalendarByYear/2026'
  ];
  for (const url of urls) {
    console.log(await checkUrl(url));
  }
};
run();
