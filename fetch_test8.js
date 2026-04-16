import https from 'https';
https.get('https://openholidaysapi.org/PublicHolidays?countryIsoCode=ID&languageIsoCode=ID&validFrom=2024-01-01&validTo=2024-12-31', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.substring(0, 500)));
});
