fetch('https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec?action=getHomeData')
  .then(res => res.json())
  .then(json => {
    console.log(JSON.stringify(json.data.review).substring(0, 500));
  })
  .catch(console.error);
