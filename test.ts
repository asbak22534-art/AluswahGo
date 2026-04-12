fetch('https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec?action=getSecondaryData')
  .then(res => res.json())
  .then(json => {
    console.log(Object.keys(json.data));
    console.log(json.data.review.length);
    console.log(json.data.review[0]);
  })
  .catch(console.error);
