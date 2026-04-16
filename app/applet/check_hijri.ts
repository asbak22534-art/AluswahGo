const fetchHijri = async () => {
  const res = await fetch('https://api.aladhan.com/v1/gToHCalendar/2026');
  const json = await res.json();
  const april = json.data['4'];
  april.forEach((day: any) => {
    const gDate = day.gregorian.day;
    const hDay = day.hijri.day;
    const hMonth = day.hijri.month.en;
    if (gDate === '01' || gDate === '02' || gDate === '03' || gDate === '04' || gDate === '05') {
      console.log(`April ${gDate}: ${hDay} ${hMonth}`);
    }
  });
};
fetchHijri();
