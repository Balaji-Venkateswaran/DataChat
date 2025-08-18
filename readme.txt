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
pip install -r requirements.txt
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

