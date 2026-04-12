const fetchSheetJsonp = (sheetId: string, sheetName: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Mocking JSONP for Node.js
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&sheet=${sheetName}`;
    
    fetch(url)
      .then(res => res.text())
      .then(text => {
        // Extract JSON from callback
        const jsonStr = text.substring(text.indexOf('(') + 1, text.lastIndexOf(')'));
        resolve(JSON.parse(jsonStr));
      })
      .catch(reject);
  });
};

fetchSheetJsonp('1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s', 'DB_SISWA')
  .then(data => {
    const parsedStudents = [];
    const uniqueClasses = new Set<string>();
    const uniqueYears = new Set<string>();

    data.table.rows.forEach((row: any) => {
      if (!row.c) return;
      
      const nama = row.c[1]?.v ? String(row.c[1].v).trim() : '';
      const kelas = row.c[2]?.v ? String(row.c[2].v).trim() : '';
      const tahun = row.c[4]?.v ? String(row.c[4].v).trim() : '';
      
      if (nama && kelas && nama !== '' && kelas !== '' && kelas !== '-' && nama !== '-') {
        parsedStudents.push({ nama, kelas, tahun: tahun || '' });
        uniqueClasses.add(kelas);
        if (tahun && tahun !== '' && tahun !== '-') {
          uniqueYears.add(tahun);
        }
      }
    });
    console.log("Classes:", Array.from(uniqueClasses));
    console.log("Years:", Array.from(uniqueYears));
  })
  .catch(console.error);
