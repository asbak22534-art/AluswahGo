fetch('https://docs.google.com/spreadsheets/d/1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s/gviz/tq?tqx=out:csv&sheet=DB_SISWA')
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 500)))
  .catch(console.error);
