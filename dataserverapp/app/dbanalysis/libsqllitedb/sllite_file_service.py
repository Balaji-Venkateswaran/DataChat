import os
import shutil
import json
from uuid import uuid4
from datetime import datetime
from fastapi import UploadFile, HTTPException
import pandas as pd
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from app.dbanalysis.libsqllitedb.sqllitedatabase import get_connection 


UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(dotenv_path=env_path)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not set in .env file.")
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
print(f" upload dir{GOOGLE_API_KEY}")
embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)
async def save_upload_file(file: UploadFile) -> str:
    print(f" upload dir{UPLOAD_DIR}")
    file_path = os.path.join(UPLOAD_DIR, file.filename) # type:ignore
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

async def save_upload_file_and_store(file: UploadFile):
    file_ext = os.path.splitext(file.filename)[1].lower() # type:ignore
    if file_ext not in [".csv", ".xlsx", ".db"]:
        raise HTTPException(status_code=400, detail="Only .csv, .xlsx, and .db files are supported.")
    file_path = await save_upload_file(file)   
    print(f"file path is : {file_ext}")
    try:
        if file_ext == ".csv":
            df = pd.read_csv(file_path)
        elif file_ext == ".xlsx":
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail=".db file processing not implemented yet.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")    
    content_text = df.to_string(index=False)
    try:
        vector = embedding.embed_query(content_text[:8192])  
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")   
    doc_id = str(uuid4())
    now = datetime.utcnow().isoformat()
    columns = ",".join(df.columns) 
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (
                id, filename, filepath, filetype, columns, content_text, embedding, uploaded_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            file.filename,
            file_path,
            file_ext.strip("."),
            columns,
            content_text,
            json.dumps(vector),
            now,
            now
        ))
        conn.commit()
        conn.close()
    except Exception as db_error:
        raise HTTPException(status_code=500, detail=f"DB insert failed: {str(db_error)}")
    return {"message": "File uploaded and embedded using Gemini successfully."}
