

function uploadFile(event) {
  const file = event.target.files[0];
  
  const fileNameArr = file.name;
  const fileNameExtacter = fileNameArr.split('.')
  const fileName = fileNameExtacter[fileNameExtacter.length-1];
  console.log("Uploaded File:", file,fileName);
  switch(fileName){
    case 'db':
      extractDBfile(file);
    break;
    case 'xlsx':
    case 'xls' :
      extractXlsxFile(file);
    break;
  }

}

function extractDBfile(file) {
  initSqlJs({
    locateFile: filename => `https://sql.js.org/dist/${filename}`
  }).then(SQL => {
    const reader = new FileReader();
    reader.onload = function () {
      const uInt8Array = new Uint8Array(reader.result);
      const db = new SQL.Database(uInt8Array);
     
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      console.log(result)
      if (!result.length) {
        console.log("No tables found.");
        return;
      }
      const tableNames = result[0].values.flat();

      tableNames.forEach(table => {
        const pragma = db.exec(`PRAGMA table_info(${table});`);
        console.log(`Table: ${table}`);
        pragma[0].values.forEach(row => {
          const [cid, name, type, notnull, dflt_value, pk] = row;
          console.log(`  Column: ${name}, Type: ${type}, Not Null: ${notnull}, Default: ${dflt_value}, PK: ${pk}`);
        });
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

function extractXlsxFile(e){
// document.getElementById("excelFile").addEventListener("change", function (e) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      console.log(workbook)
      const sheetName = workbook.SheetNames[1];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = jsonData[0]; // First row = column names
      const firstRow = jsonData[1]; // Sample row
      const inferredTypes = headers.map((header, i) => {
        const val = firstRow[i];
        if (val == null) return "NULL";
        return !isNaN(Number(val)) ? "NUMBER" : "TEXT";
      });

      const schema = headers.map((col, i) => ({
        column: col,
        type: inferredTypes[i]
      }));

      console.log("Inferred Table Schema:", schema);
    };
    reader.readAsArrayBuffer(e);
  // });
}
