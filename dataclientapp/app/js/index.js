
const tableStructure = []

function uploadFile(event) {
  for (let i = 0; i < event.target.files.length; i++) {
    const file = event.target.files[i];
    const fileNameArr = file.name;
    const fileNameExtacter = fileNameArr.split('.')
    const fileName = fileNameExtacter[fileNameExtacter.length - 1];
    console.log("Uploaded File:", file, fileName);
    switch (fileName) {
      case 'db':
        extractDBfile(file);
        break;
      case 'xlsx':
      case 'csv':
        extractXlsxFile(file);
        break;
    }
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
      console.log("result", result)
      if (!result.length) {
        console.log("No tables found.");
        return;
      }

      result.forEach((teble, i) => {
        const tableNames = result[i].values.flat();
        tableNames.forEach(table => {
          const pragma = db.exec(`PRAGMA table_info(${table});`);
          console.log(`Table: ${table}`);
          let tempArr = {
            tableNames: table,
            tableInfo: []
          }
          pragma[0].values.forEach(row => {
            const [cid, name, type, notnull, dflt_value, pk] = row;
            tempArr.tableInfo.push({
              Column: name,
              Type: type,
              Default: dflt_value,
              PK: pk,
              Not_Null: notnull
            })
            console.log(`  Column: ${name}, Type: ${type}, Not Null: ${notnull}, Default: ${dflt_value}, PK: ${pk}`);
          });
          tableStructure.push(tempArr)
        });
      })
      console.log(tableStructure)
    };
    reader.readAsArrayBuffer(file);

  });

}

function extractXlsxFile(e) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    console.log("workbook", workbook)

    for (let i = 0; i < workbook?.SheetNames.length; i++) {
      tempArr = {
        tableName: '',
        tableInfo: []
      }
      const sheetName = workbook.SheetNames[i];

      console.log("sheet", sheetName)
      const worksheet = workbook.Sheets[sheetName];
      tempArr.tableName = sheetName
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = jsonData[0];
      const firstRow = jsonData[1];
      const inferredTypes = headers.map((header, i) => {
        const val = firstRow[i];
        if (val == null) return "NULL";
        return !isNaN(Number(val)) ? "NUMBER" : "TEXT";
      });

      const schema = headers.map((col, i) => ({
        column: col,
        type: inferredTypes[i],
        Default: "NA",
        PK: "NA",
        Not_Null: "NA"
      }));
      tempArr.tableInfo.push(schema)
      tableStructure.push(tempArr)
    }
    console.log("Inferred Table Schema:", tableStructure);
  };
  reader.readAsArrayBuffer(e);
}



// unused code
// const file = event.target.files[0];
// const fileNameArr = file.name;
// const fileNameExtacter = fileNameArr.split('.')
// const fileName = fileNameExtacter[fileNameExtacter.length-1];
// console.log("Uploaded File:", file,fileName);
// switch(fileName){
//   case 'db':
//     extractDBfile(file);
//   break;
//   case 'xlsx':
//   case 'xls' :
//     extractXlsxFile(file);
//   break;
// }