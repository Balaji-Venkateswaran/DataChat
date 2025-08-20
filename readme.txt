Data Chat – Smart Data Query & Visualization Assistant
_______________________________________________________
A simple, client-side tool to upload datasets, ask questions in plain English, and instantly
get SQL queries, charts, and downloadable results

About The Project
__________________
This is an intuitive, browser-based tool that allows users to upload datasets in CSV, Excel, or SQLite format 
and explore them without any coding. Users can ask questions in plain English, and the tool automatically generates 
SQL queries, displays results in tables, and creates interactive visualizations. All data processing happens on the 
client side, ensuring privacy and speed. Results can be easily downloaded for further use.

Features
_________
Client-Side Execution Only: Fully frontend-powered using Vanilla JavaScript—no server, backend, or data upload 
required for processing.

Multi-Format File Support: Easily upload and analyze datasets in .csv, .xlsx, .sqlite3, or .db formats.

Automatic Table Structure Detection: Instantly displays all table names, columns, and data types upon file 
upload for quick schema understanding.

Smart Question Suggestions: Automatically suggests relevant and insightful questions based on your dataset's 
structure to guide your analysis.

Natural Language Interface: Ask data-related questions in plain English—e.g., “What was the average profit in 
2022?”—and receive precise, structured responses.

LLM-Powered Query Engine: Uses lightweight LLMs (GPT-4.1-nano, o4-mini, Gemini Flash, etc.) to interpret queries, 
build logic, and generate optimized SQL queries.

Detailed Analytical Feedback: Each query returns:
A plain-English explanation of your question
Logical steps and analysis used to derive the result
Relevant table relationships
Auto-generated SQL query
JavaScript (Chart.js) code for visualization

Dynamic Table View & Export:
View results in a responsive, interactive table
Export the results as a .csv file
Copy or download the generated SQL query

Built-In Chart Visualizations: Automatically render charts using Chart.js, including:
Bar, Line and Pie
Downloadable JavaScript chart code for reuse or modification

Prerequisites
_____________
A modern web browser (e.g., Chrome, Firefox, Safari, Edge).
`git` installed on your system to clone the repository.

Clone the Repository
____________________
Open your terminal or command prompt and run the following command:
CMD: git clone [https://github.com/Balaji-Venkateswaran/DataChat.git]


Getting Started
________________
Follow these simple steps to get the tool up and running on your local machine.

Run the Server
______________
Step 1:
Open the project folder in VS Code.

Step 2:
Open a terminal (VS Code Terminal or Command Prompt).

Step 3:
Navigate to the server directory:
CMD: cd Datachat/dataserverapp

Step 4:
Verify Python is installed:
CMD: python -V
Next:
If you see a version (e.g., Python 3.12.x), continue.
If not installed -----> Download & Install min Python 3.x. (https://www.python.org/downloads/)

Step 5:
Install dependencies:
___________________
cd Datachat/dataserverapp
pip install -r requirement.txt
pip install matplotlib
pip install duckdb

Step 6:
Run the server:
_______________
cd Datachat/dataserverapp  ( cmd path should be in this dir)
run.bat else just type run  only, it start the server
If everything is fine, the terminal will show the server running URL & port 

Step 7:
Run the Client
_________________
Navigate to the client app directory:
CMD: cd Datachat/dataclientapp/app/html

Step 8:
Install VS Code extension ----> Search: Live Server Preview.

Step 9:
Right-click on index.html -----> select Open with Live Server Preview.

Step 10:
Upload a file and start using the client.

Note
______
Temporarily turn off Kaspersky antivirus if it blocks the server or client connection.

If everything is fine, you’ll see the server running URL & port 

