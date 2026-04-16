const fetchTest = async () => {
  const res = await fetch('https://api.aladhan.com/v1/gToHCalendar/2026');
  console.log(res.status);
  const json = await res.json();
  console.log(Object.keys(json));
  console.log(json.code, json.status);
};
fetchTest();
