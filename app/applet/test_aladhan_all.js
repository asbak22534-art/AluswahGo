import https from 'https';

const fetchMonth = (month, year) => {
  return new Promise((resolve, reject) => {
    https.get(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status Code: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const fetchAll = async () => {
  try {
    const promises = Array.from({ length: 12 }, (_, i) => fetchMonth(i + 1, 2026));
    await Promise.all(promises);
    console.log("Success");
  } catch (e) {
    console.error("Failed:", e.message);
  }
};

fetchAll();
