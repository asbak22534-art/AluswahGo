import fs from 'fs';

fetch('https://docs.google.com/spreadsheets/d/1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s/gviz/tq?tqx=out:csv&sheet=DB_SISWA')
  .then(res => res.text())
  .then(csv => {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < csv.length; i++) {
          const char = csv[i];
          if (char === '"' && csv[i+1] === '"') {
            currentCell += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
          } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
          } else if (char === '\r' && !inQuotes) {
            // ignore
          } else {
            currentCell += char;
          }
        }
        if (currentRow.length > 0 || currentCell !== '') {
          currentRow.push(currentCell);
          rows.push(currentRow);
        }

        const parsedStudents = [];
        const uniqueClasses = new Set<string>();
        const uniqueYears = new Set<string>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Strip quotes and trim
          const nama = row[1]?.replace(/^["']|["']$/g, '').trim();
          const kelas = row[2]?.replace(/^["']|["']$/g, '').trim();
          const tahun = row[4]?.replace(/^["']|["']$/g, '').trim();
          
          if (nama && kelas && nama !== '' && kelas !== '' && kelas !== '-' && nama !== '-') {
            parsedStudents.push({ nama, kelas, tahun: tahun || '' });
            uniqueClasses.add(kelas);
            if (tahun && tahun !== '' && tahun !== '-') {
              uniqueYears.add(tahun);
            }
          }
        }
        
        console.log("Classes:", Array.from(uniqueClasses));
        console.log("Years:", Array.from(uniqueYears));
  })
  .catch(console.error);
