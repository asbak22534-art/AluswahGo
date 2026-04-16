import https from 'https';
https.get('https://api.aladhan.com/v1/gToHCalendar/2026', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const april = json.data['4']; // April is month 4
    april.forEach(day => {
      const gDate = day.gregorian.day;
      const hDay = day.hijri.day;
      const hMonth = day.hijri.month.en;
      if (gDate === '02' || gDate === '03' || gDate === '04') {
        console.log(`April ${gDate}: ${hDay} ${hMonth}`);
      }
    });
  });
});
