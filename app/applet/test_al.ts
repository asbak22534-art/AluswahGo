const fetchTest = async () => {
  const res = await fetch('https://api.aladhan.com/v1/gToHCalendar/1/2026');
  console.log(res.status);
};
fetchTest();
