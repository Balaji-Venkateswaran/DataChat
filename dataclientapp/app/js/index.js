let tableStructure = [];
var selectedFile = null;
function uploadFile(event) {
  tableStructure = [];
  for (let i = 0; i < event.target.files.length; i++) {
    const file = event.target.files[i];
    selectedFile = file;
    const fileNameArr = file.name;
    const fileNameExtacter = fileNameArr.split(".");
    const fileName = fileNameExtacter[fileNameExtacter.length - 1];
    console.log("Uploaded File:", file, fileName);
    switch (fileName) {
      case "db":
        extractDBfile(file);
        break;
      case "xlsx":
      case "csv":
      case "xls":
        extractXlsxFile(file);
        break;
    }
  }
}

function extractDBfile(file) {
  initSqlJs({
    locateFile: (filename) => `https://sql.js.org/dist/${filename}`,
  }).then((SQL) => {
    const reader = new FileReader();
    reader.onload = function () {
      const uInt8Array = new Uint8Array(reader.result);
      const db = new SQL.Database(uInt8Array);
      const result = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table';"
      );
      console.log("result", result);
      if (!result.length) {
        console.log("No tables found.");
        return;
      }

      result.forEach((teble, i) => {
        const tableNames = result[i].values.flat();
        tableNames.forEach((table) => {
          const pragma = db.exec(`PRAGMA table_info(${table});`);
          console.log(`Table: ${table}`);
          let tempArr = {
            tableNames: table,
            tableInfo: [],
          };
          pragma[0].values.forEach((row) => {
            const [cid, name, type, notnull, dflt_value, pk] = row;
            tempArr.tableInfo.push({
              Column: name,
              Type: type,
              Default: !dflt_value ? "Null" : dflt_value,
              PK: pk == "1" ? pk : "NO",
              Not_Null: !notnull ? "NO" : notnull,
            });
            console.log(
              `  Column: ${name}, Type: ${type}, Not Null: ${notnull}, Default: ${dflt_value}, PK: ${pk}`
            );
          });
          tableStructure.push(tempArr);
        });
      });
      console.log(tableStructure);
      displayTableStructure();
    };
    reader.readAsArrayBuffer(file);
  });
}

function extractXlsxFile(e) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    console.log("workbook", workbook);

    for (let i = 0; i < workbook?.SheetNames.length; i++) {
      tempArr = {
        tableNames: "",
        tableInfo: [],
      };
      const sheetName = workbook.SheetNames[i];

      console.log("sheet", sheetName);
      const worksheet = workbook.Sheets[sheetName];
      tempArr.tableNames = sheetName;
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
        Default: "Null",
        PK: "NO",
        Not_Null: "NO",
      }));
      tempArr.tableInfo.push(...schema);
      tableStructure.push(tempArr);
    }
    console.log("Inferred Table Schema:", tableStructure);
    displayTableStructure();
  };
  reader.readAsArrayBuffer(e);
}
function exportToCSV(tableName) {
  var exportLink = document.createElement("a");
  var csvContent = tableStructure
    .filter((table) => table.tableNames === tableName)
    .map((table) => {
      console.log("table", table, table.tableInfo[0]);
      const headers = Object.keys(table.tableInfo[0]);
      const rows = table.tableInfo.map((row) =>
        headers.map((header) => row[header]).join(",")
      );
      return [headers.join(","), ...rows].join("\n");
    })
    .join("\n\n");
  console.log("csvContent", csvContent);
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  exportLink.href = url;
  exportLink.setAttribute("download", `${tableName}-${Date.now()}.csv`);
  exportLink.click();
}

function displayTableStructure() {
  const outputDiv = document.getElementById("tableOutput");
  outputDiv.innerHTML = "";

  tableStructure.forEach((table) => {
    const containerDiv = document.createElement("div");
    containerDiv.classList.add("container-box");
    // containerDiv.style.border = "1px solid #ccc";
    containerDiv.style.padding = "10px";
    containerDiv.style.marginBottom = "20px";

    const title = document.createElement("h3");
    title.textContent = `Table: ${table.tableNames}`;

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export";
    exportBtn.classList.add("export-button");

    exportBtn.addEventListener("click", function () {
      exportToCSV(table.tableNames);
    });

    // Add title and button to container
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.alignItems = "center";
    headerRow.appendChild(title);
    headerRow.appendChild(exportBtn);
    containerDiv.appendChild(headerRow);

    // Create table
    const htmlTable = document.createElement("table");
    htmlTable.style.marginTop = "10px";
    htmlTable.style.width = "100%";
    htmlTable.style.borderCollapse = "collapse";
    htmlTable.border = "1";

    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    Object.keys(table.tableInfo[0]).forEach((key) => {
      const th = document.createElement("th");
      th.textContent = key;
      th.style.padding = "6px";
      header.appendChild(th);
    });
    thead.appendChild(header);
    htmlTable.appendChild(thead);

    const tbody = document.createElement("tbody");
    table.tableInfo.forEach((row) => {
      const tr = document.createElement("tr");
      Object.values(row).forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        td.style.padding = "6px";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    htmlTable.appendChild(tbody);
    containerDiv.appendChild(htmlTable);

    // Append container to output
    outputDiv.appendChild(containerDiv);
  });
}

async function submitQuestion() {
  const questionInput = document.getElementById("question");
  const contextInput = document.getElementById("context");
  var resultDiv = document.getElementById("result");
  console.log(
    "questionInput",
    questionInput.value,
    contextInput.value,
    selectedFile
  );
  // const res = fetch("http://localhost:8000/api/message/").then((res) => {
  //   return res.json()
  // }).then((output) => {
  //   console.log(output)
  // })

  const res = await fetch("http://localhost:8000/api/sql-query/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: "top 1 rrecord",
    }),
  });

  if (res.status === 200) {
    const data = await res.json();
    console.log(data?.table_html);
    resultDiv.innerHTML = data?.table_html;
    // document.getElementById('resultDiv').innerHTML = data?.table_html || "<p>No data</p>";
  }
}
