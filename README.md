# Data Chat – Smart Data Query & Visualization Assistant

**Data Chat** is a simple, client-side tool to upload datasets, ask questions in plain English, and instantly get SQL queries, charts, and downloadable results. 

---
## About the Project

**Data Chat** is an interactive data query tool that empowers users to explore datasets, generate SQL queries, derive insights, and visualize results. Users can upload files and instantly interact with the data through smart question suggestions and real-time table previews. Built in Python, the system uses LangChain to orchestrate LLM models like Gemini 2.5 Flash and Gemini 1.5 Flash, enabling intelligent SQL query generation, actionable insights, and dynamic chart visualizations. The application relies entirely on **DuckDB (Standalone)** for high-performance, in-memory or local file–based analytics execution. While **CloudDB (Supabase)** was tested for persistent storage of user accounts, file metadata, chat history, and saved queries.

---
## Features

Multi-Format File Support: Easily upload and analyze datasets in .csv, .xlsx, .sqlite3, or .db formats.

Automatic Table Structure Detection: Instantly displays all table names, columns, and data types upon file upload for quick schema understanding.

Smart Question Suggestions: Automatically suggests relevant and insightful questions based on your dataset's structure to guide your analysis.

Natural Language Interface: Ask data-related questions in plain English—e.g., “What was the average profit in 2022?”—and receive precise, structured responses.

LLM-Powered Query Engine: Uses lightweight LLMs (GPT-4.1-nano, o4-mini, Gemini Flash, etc.) to interpret queries, build logic, and generate optimized SQL queries.

Detailed Analytical Feedback: Each query returns:

A plain-English explanation of your question

Logical steps and analysis used to derive the result

Relevant table relationships

Auto-generated SQL query

Dynamic Table View & Export:
View results in a responsive, interactive table

Export the results as a .csv file

Copy or download the generated SQL query

Built-In Chart Visualizations: Automatically render charts using matplotlib, including:
Bar, Line and Pie

---
## Prerequisites

A modern web browser (e.g., Chrome, Firefox, Safari, Edge).

Download & Install min Python 3.x. (https://www.python.org/downloads/)

`git` installed on your system to clone the repository.

---
## Clone the Repository

Open your terminal or command prompt and run the following command:
CMD: git clone [https://github.com/Balaji-Venkateswaran/DataChat.git]

---
## Getting Started

Follow these simple steps to get the tool up and running on your local machine.

---
## Run the Server

**Step 1:**
Open the project folder in VS Code.

**Step 2:**
Open a terminal (VS Code Terminal or Command Prompt).

**Step 3:**
Navigate to the server directory:
CMD: cd Datachat/dataserverapp

**Step 4:**
Verify Python is installed:
CMD: python -V
Next:
If you see a version (e.g., Python 3.12.x), continue.

If not installed -----> Download & Install min Python 3.x. (https://www.python.org/downloads/)

**Step 5:**
#### Install dependencies:
cd Datachat/dataserverapp

pip install -r requirements.txt

pip install matplotlib

pip install duckdb

**Step 6:**
#### Run the server:
CMD: cd Datachat/dataserverapp  ( cmd path should be in this dir)

run.bat else just type run  only, it start the server

If everything is fine, the terminal will show the server running URL & port 

**Step 7:**
#### Run the Client
Navigate to the client app directory: 
CMD: cd Datachat/dataclientapp/app/html

**Step 8:**
Install VS Code extension ----> Search: Live Server Preview.

**Step 9:**
Right-click on index.html -----> select Open with Live Server Preview.

**Step 10:**
Upload a file and start using the client.

---
## Note

Temporarily turn off Kaspersky antivirus if it blocks the server or client connection.

If everything is fine, you’ll see the server running URL & port 

---
