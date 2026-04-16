const fetchHolidays = async () => {
  const res = await fetch('https://raw.githubusercontent.com/guangrei/Json-Indonesia-holidays/master/calendar.json');
  const data = await res.json();
  console.log(JSON.stringify(data).substring(0, 500));
};
fetchHolidays();
