# 📊 Data Chat – Smart Data Query & Visualization Assistant

**Data Chat** is a simple, browser-based tool to upload datasets, ask questions in plain English, and instantly get SQL queries, charts, and downloadable results — all without any coding or server involvement.

---

## 🚀 About The Project

**Data Chat** is an intuitive, fully client-side tool that empowers users to explore datasets in formats like CSV, Excel, and SQLite. Ask data-related questions in plain English and get SQL queries, visualizations, and insights in real time.

🔐 All processing is done **locally in your browser**, ensuring privacy and speed.

---

## ✨ Features

- **💻 100% Client-Side Execution**  
  No backend, no server—powered entirely by Vanilla JavaScript. Your data never leaves your computer.

- **📂 Multi-Format File Support**  
  Upload and analyze datasets in `.csv`, `.xlsx`, `.sqlite3`, or `.db` formats.

- **🧠 Automatic Table Detection**  
  Instantly detects table names, columns, and data types for quick schema understanding.

- **🤖 Smart Question Suggestions**  
  Generates helpful questions based on your dataset structure.

- **💬 Natural Language Interface**  
  Ask questions like:  
  `"What was the average profit in 2022?"`  
  and get structured answers and SQL code.

- **🧩 LLM-Powered Query Engine**  
  Uses lightweight LLMs (e.g., GPT-4.1-nano, o4-mini, Gemini Flash) to understand and translate your questions into SQL.

- **📊 Detailed Analytical Feedback**  
  Every query returns:
  - A plain-English explanation
  - Logical steps used in analysis
  - Inferred table relationships
  - Auto-generated SQL query
  - Chart.js-based visualization code

- **📈 Built-In Chart Visualizations**  
  Automatically render:
  - Bar Charts  
  - Line Charts  
  - Pie Charts  
  With downloadable Chart.js code.

- **📋 Dynamic Table View & Export**  
  - Interactive table view of results  
  - Export results to `.csv`  
  - Copy or download SQL query

---

## 🧰 Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- `git` installed on your system
- Python 3.x installed

---

## 📥 Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/Balaji-Venkateswaran/DataChat.git
