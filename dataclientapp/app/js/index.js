let tableStructure = [];
var selectedFile = null;
var resultSqlQuery = null;
var resultBinaryData = null;
let resultQuestions = [];
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

async function extractXlsxFile(e) {
  if (e) {
    uploadFileToDataChatServer(e);
  }
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
    displayTableStructure(e);
  };
  reader.readAsArrayBuffer(e);
}

async function uploadFileToDataChatServer(file) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(
      "http://localhost:8000/api/upload-and-store-context/",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await res.json();
    if (res.ok) {
      console.log("Upload successful:", result);
      console.log("Upload successful:", result.message); //add question and display in screen-for ref
      resultQuestions = result?.questions;
      displayQuestions();
    } else {
      console.error("Upload failed:", result.detail || "Error");
    }
  } catch (error) {
    console.error("Error  uploading file:", error);
  }
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

// function displayQuestions() {
//   const outputDiv = document.getElementById("divQuestion");
//   if (resultBinaryData && Array.isArray(resultBinaryData)) {
//     for (let i = 0; i < resultBinaryData.length; i++) {
//       const value = resultBinaryData[i];
//       const p = document.createElement("p");
//       p.textContent = `${i + 1}. ${value}`;
//       outputDiv.appendChild(p);
//     }
//   }
// }

function displayQuestions() {
  const outputDiv = document.getElementById("divQuestions");
  outputDiv.innerHTML = ""; // Clear previous content

  if (Array.isArray(resultQuestions)) {
    resultQuestions.forEach((question, index) => {
      const p = document.createElement("p");
      p.textContent = `${index + 1}. ${question}`;
      outputDiv.appendChild(p);
    });
  } else {
    outputDiv.innerHTML = "<p>No questions found.</p>";
  }
}


function displayTableStructure(e) {
  const outputDiv = document.getElementById("tableOutput");
  outputDiv.innerHTML = "";

  tableStructure.forEach((table) => {
    const containerDiv = document.createElement("div");
    containerDiv.classList.add("container-box");
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

    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.alignItems = "center";
    headerRow.appendChild(title);
    headerRow.appendChild(exportBtn);
    containerDiv.appendChild(headerRow);

    const htmlTable = document.createElement("table");
    htmlTable.classList.add("result-custom-table");

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

    const scrollContainer = document.createElement("div");
    scrollContainer.classList.add("result-table-container");
    scrollContainer.appendChild(htmlTable);
    containerDiv.appendChild(scrollContainer);

    outputDiv.appendChild(containerDiv);
  });
}

async function submitQuestion() {
  showLoader();
  const questionInput = document.getElementById("question");
  const contextInput = document.getElementById("context");
  const resultTableDiv = document.getElementById("result-table");
  const resultQueryDiv = document.getElementById("result-query");
  // const question = questionInput?.value?.trim();
  // const context = contextInput?.value?.trim();
  const context =
    "The table contains employee information such as name, age, department, salary and experience.";
  const question =
    "How can I list all employees with a 'Salary' greater than 75000?";

  if (!question || !context) {
    alert("Please enter both question and context.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/query-by-context-auto-id/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: context,
          question: question,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    resultTableDiv.innerHTML = data?.table_html || "<p>No data found</p>";
    // resultQueryDiv.innerHTML = `<pre>${data?.sql || "No SQL generated"}</pre>`;
    resultQueryDiv.innerHTML = `<pre>${(
      data?.sql || "No SQL generated"
    ).replace(/\n/g, " ")}</pre>`;

    resultBinaryData = data?.excel_base64 || null;

    if (data?.table_html) {
      drawChartRunTime();
    }
  } catch (error) {
    console.error("Error occurred:", error);
    resultTableDiv.innerHTML = "<p>Error fetching data</p>";
    resultQueryDiv.innerHTML = "";
  }
  document.getElementById("resultSection").style.display = "block";
  hideLoader();
}
let chartInstance = null;

function showLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "flex"; // flex to apply gap & center
}

function hideLoader() {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
}

function parseTableToChartData(tableId = "result-table") {
  const table = document.querySelector(`#${tableId} table`);
  const labels = [];
  const data = [];

  if (!table) return { labels, data };

  const headerCells = Array.from(table.querySelectorAll("thead tr th"));
  const deptIndex = headerCells.findIndex(
    (cell) => cell.innerText.trim().toLowerCase() === "department"
  );
  const salaryIndex = headerCells.findIndex(
    (cell) => cell.innerText.trim().toLowerCase() === "salary"
  );

  const useDeptAndSalary = deptIndex !== -1 && salaryIndex !== -1;
  const rows = table.querySelectorAll("tbody tr");

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (useDeptAndSalary && cells.length > Math.max(deptIndex, salaryIndex)) {
      const label = cells[deptIndex].innerText.trim();
      const value = parseFloat(cells[salaryIndex].innerText.trim());
      if (label && !isNaN(value)) {
        labels.push(label);
        data.push(value);
      }
    } else {
      if (cells.length >= 2) {
        const label = cells[0].innerText.trim();
        const rawValue = cells[1].innerText.trim();
        const value = parseFloat(rawValue);
        if (label && !isNaN(value)) {
          labels.push(label);
          data.push(value);
        }
      }
    }
  });

  return { labels, data };
}

// function drawChartRunTime() {
//   const { labels, data } = parseTableToChartData();
//   const canvas = document.getElementById("chartCanvas");
//   if (!canvas) return;
//   const ctx = canvas.getContext("2d");

//   new Chart(ctx, {
//     type: "bar",
//     data: {
//       labels: labels,
//       datasets: [
//         {
//           label: "Chart Data",
//           data: data,
//           backgroundColor: "rgba(75, 192, 192, 0.6)",
//           borderColor: "rgba(75, 192, 192, 1)",
//           borderWidth: 1,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       scales: {
//         y: {
//           beginAtZero: true,
//         },
//       },
//     },
//   });
// }

function drawChartRunTime() {
  const { labels, data } = parseTableToChartData();
  const canvas = document.getElementById("chartCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // ✅ Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Chart Data",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function downloadQueryResult() {
  if (!resultBinaryData) {
    alert("No data available to download.");
    return;
  }
  const byteCharacters = atob(resultBinaryData);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "query_results.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// function uploadFile(event) {
//   // ✅ Clear previous state
//   tableStructure = [];
//   selectedFile = null;
//   resultSqlQuery = null;
//   resultBinaryData = null;
//   resultQuestions = [];

//   // ✅ Clear related UI elements
//   document.getElementById("tableOutput").innerHTML = "";
//   document.getElementById("result-table").innerHTML = "";
//   document.getElementById("result-query").innerHTML = "";
//   document.getElementById("resultSection").style.display = "none";
//   document.getElementById("divQuestions").innerHTML = "";
//   const chartCanvas = document.getElementById("chartCanvas");
//   if (chartCanvas) {
//     const ctx = chartCanvas.getContext("2d");
//     ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
//   }

//   for (let i = 0; i < event.target.files.length; i++) {
//     const file = event.target.files[i];
//     selectedFile = file;
//     const fileNameArr = file.name;
//     const fileNameExtacter = fileNameArr.split(".");
//     const fileName = fileNameExtacter[fileNameExtacter.length - 1].toLowerCase();
//     console.log("Uploaded File:", file, fileName);
//     switch (fileName) {
//       case "db":
//         extractDBfile(file);
//         break;
//       case "xlsx":
//       case "csv":
//       case "xls":
//         extractXlsxFile(file);
//         break;
//       default:
//         alert("Unsupported file type.");
//     }
//   }
// }

function uploadFile(event) {

  document.getElementById("divQuestions").style.display = "block";
document.getElementById("resultSection").style.display = "none";
document.getElementById("result-table").innerHTML = "";
document.getElementById("chartCanvas").style.display = "none";
  // ✅ Reset state
  tableStructure = [];
  selectedFile = null;
  resultSqlQuery = null;
  resultBinaryData = null;
  resultQuestions = [];

  // ✅ Clear UI
  document.getElementById("tableOutput").innerHTML = "";
  document.getElementById("result-table").innerHTML = "";
  document.getElementById("result-query").innerHTML = "";
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("divQuestions").innerHTML = "";

  // ✅ Destroy chart instance if exists
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // ✅ Clear canvas (optional, just to reset visual)
  const canvas = document.getElementById("chartCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ✅ Process new file
  for (let i = 0; i < event.target.files.length; i++) {
    const file = event.target.files[i];
    selectedFile = file;
    const fileNameExtacter = file.name.split(".");
    const fileExt = fileNameExtacter[fileNameExtacter.length - 1].toLowerCase();

    switch (fileExt) {
      case "db":
        extractDBfile(file);
        break;
      case "xlsx":
      case "csv":
      case "xls":
        extractXlsxFile(file);
        break;
      default:
        alert("Unsupported file type.");
    }
  }
}
