const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby6a5GzCbHy8NjxOVF7OeGWogdLpEJlXarBDeiG_0BlHtoHDpmKbOEaIf1qzcbN2KpD/exec';
async function test() {
  const res = await fetch(SCRIPT_URL + '?action=getSecondaryData&t=' + Date.now());
  const data = await res.json();
  console.log('Pengaturan keys:', Object.keys(data.data.pengaturan || {}));
  console.log('Pengaturan values:', data.data.pengaturan);
}
test();
