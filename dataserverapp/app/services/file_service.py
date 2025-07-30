import os
import shutil
from fastapi import UploadFile, HTTPException
import pandas as pd
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from supabase import create_client, Client
from langchain.vectorstores.supabase import SupabaseVectorStore

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

llm_api_key = os.getenv("GOOGLE_API_KEY")
if not llm_api_key:
    print("API key required.")
    exit(1)
os.environ["GOOGLE_API_KEY"] = llm_api_key
print(f"api key is {llm_api_key}")

#/.supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLENAME = os.environ.get("SUPABASE_TABLE_NAME")
if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_TABLENAME:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY and SUPABASE_TABLENAME environment variables must be set.")

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_vector_store = SupabaseVectorStore(
    embedding=embedding,
    client=supabase_client,
    table_name=SUPABASE_TABLENAME,  
    query_name="match_file_documents"
)
#./

#/.File upload
async def save_upload_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    file.file.seek(0)
    file_path = os.path.join(UPLOAD_DIR, str(file.filename))
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path


async def save_upload_file_and_store(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".xlsx", ".xls",".db"]
    if file_ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Only {allowed_exts} files are supported.")

    file.file.seek(0)
    file_path = os.path.join(UPLOAD_DIR, str(file.filename))
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read Excel: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Excel file is empty.")

    columns = ",".join(df.columns)
    text_content = df.to_string(index=False)

    try:
        vector = embedding.embed_query(text_content[:8192])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    insert_data = {
        "id": str(uuid4()),
        "filename": file.filename,
        "filepath": file_path,
        "filetype": "xlsx",
        "columns": columns,
        "content_text": text_content,
        "embedding": vector,
        "uploaded_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    # print(f"{insert_data}")
    response = supabase_client.table("file_documents").insert(insert_data).execute()
    print(f"columns are {columns}")
    if not response.data:
     raise HTTPException(status_code=500, detail=f"Failed to insert data into Supabase. Response: {response}")  
    return {"message": "File uploaded and embedded using Gemini successfully."}

#./file upload