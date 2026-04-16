const fetchTest = async () => {
  const year = 2026;
  try {
    const monthPromises = Array.from({ length: 12 }, (_, i) => 
      fetch(`https://api.aladhan.com/v1/gToHCalendar/${i + 1}/${year}`).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
    );
    const monthsData = await Promise.all(monthPromises);
    console.log("Success fetching 12 months");
  } catch (e) {
    console.error("Error:", e);
  }
};
fetchTest();
