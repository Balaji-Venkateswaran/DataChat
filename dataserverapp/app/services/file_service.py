import os
import shutil
from fastapi import UploadFile, HTTPException
import pandas as pd
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from supabase import create_client, Client
from fastapi.encoders import jsonable_encoder
import json
from typing import Any
import duckdb
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain.vectorstores import DuckDB
# from langchain.vectorstores.utils import DistanceStrategy
from langchain_community.vectorstores import DuckDB
from langchain_community.vectorstores.utils import DistanceStrategy

#/.Config
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
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,   
    api_key=llm_api_key   # type:ignore
)
#/.supabase-duckdb
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLENAME = os.environ.get("SUPABASE_TABLE_NAME")
if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_TABLENAME:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY and SUPABASE_TABLENAME environment variables must be set.")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
DUCKDB_PATH = "employee_data.duckdb"
TABLE_NAME = "employee_data"
EMBED_TABLE = "employee_embeddings"
duckdb_connection = duckdb.connect(DUCKDB_PATH,read_only=False)
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
    allowed_exts = [".xlsx", ".csv", ".xls", ".db"]
    if file_ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Only {allowed_exts} files are supported.")
    file.file.seek(0)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Read the file into a DataFrame
    try:
        if file_ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable.")
    # Extract columns and full content
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
        "filetype": file_ext.replace('.', ''),  
        "columns": columns,
        "content_text": text_content,
        "embedding": vector,
        "uploaded_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }

    response = supabase_client.table("file_documents").insert(insert_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail=f"Failed to insert data into Supabase. Response: {response}")
    return {"message": "File uploaded and embedded using Gemini successfully."}
#./file upload
#/. File Upload with context 
def generate_prompt_from_df(df: pd.DataFrame) -> str:
    """
    Generates a prompt from the uploaded dataset to send to Gemini for question generation.
    """
    columns = df.columns.tolist()
    types = df.dtypes.astype(str).to_dict()
    sample = df.head(3).to_dict(orient="records")
    return (
        "You are a data expert. Based on the following dataset structure and sample records, "
        "generate 5 interesting and advanced questions based on supabase a user might ask about this dataset. "
        "Return only a JSON array of questions as plain strings.\n\n"
        f"Columns: {columns}\n\n"
        f"Data Types: {types}\n\n"
        f"Sample Rows: {sample}"
    )

    # return (
    #     "You are a data expert. Based on the following dataset structure and sample records, "
    #     "generate 5 interesting and insightful basic  questions a user might ask about this dataset. "
    #     "Return only a JSON array of questions as plain strings.\n\n"
    #     f"Columns: {columns}\n\n"
    #     f"Data Types: {types}\n\n"
    #     f"Sample Rows: {sample}"
    # )

async def save_upload_file_and_store_context(file: UploadFile) -> Any:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".xlsx", ".csv", ".xls"]
    if file_ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Only {allowed_exts} files are supported.")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(content) 
    try:
        if file_ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")
    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable.") 
    for col in df.columns:
        df[col] = df[col].apply(lambda x: str(x) if isinstance(x, (pd.Timestamp, datetime)) else x)
    context = {
        "columns": df.columns.tolist(),
        "data_types": df.dtypes.astype(str).to_dict(),
        # "sample_rows": df.head(3).to_dict(orient="records")
    }
    text_content = df.to_csv(index=False)
    prompt = generate_prompt_from_df(df)
    try:
        result = llm.invoke(prompt)
        response_text = getattr(result, "content", result) if hasattr(result, "content") else str(result)

        if isinstance(response_text, str):
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text.replace("```json", "").replace("```", "").strip()
            elif response_text.startswith("```"):
                response_text = response_text.replace("```", "").strip()

            questions = json.loads(response_text)
            if not isinstance(questions, list):
                raise ValueError("Expected a JSON array of questions.")
        else:
            raise ValueError("Unexpected LLM output format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM question generation failed: {e}") 
    try:
        content_for_embedding = text_content[:8192]  
        vector = embedding.embed_query(content_for_embedding)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")
    insert_data = {
        "id": str(uuid4()),
        "filename": file.filename,
        "filepath": file_path,
        "filetype": file_ext.replace(".", ""),
        "columns": df.columns.tolist(),
        "content_text": text_content,
        "embedding": vector,
        "context_json": context,
        "questions_json": questions,
        "uploaded_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        supabase_client.table("file_document_questions").insert(insert_data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert into DB: {e}")

    return jsonable_encoder({
        "message": "File uploaded and questions generated using Gemini.",
        "context": context,
        "questions": questions
    })

#./ File Upload with context and questions

#/. Upload file to Duckdb and Generate Query */    
async def upload_file_store_duckdb(file: UploadFile):
    try:      
        file_path = os.path.join(UPLOAD_DIR, file.filename)  # type: ignore
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        ext = file.filename.split(".")[-1].lower()  # type: ignore
        if ext == "csv":
            df = pd.read_csv(file_path)
        elif ext in ["xls", "xlsx"]:
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")     
        existing_tables = duckdb_connection.execute("SHOW TABLES").fetchall()
        table_names = [t[0] for t in existing_tables]
        if TABLE_NAME in table_names:
            duckdb_connection.execute(f"DROP TABLE {TABLE_NAME}")
        if EMBED_TABLE in table_names:
            duckdb_connection.execute(f"DROP TABLE {EMBED_TABLE}")
        duckdb_connection.execute(f"CREATE TABLE {TABLE_NAME} AS SELECT * FROM df")
        columns = df.columns.tolist()
        types = df.dtypes.astype(str).tolist()
        sample = json.loads(df.head(3).to_json(orient="records", date_format="iso"))

        prompt = (
            "You are a data analyst. Based on the dataset schema and sample rows below, "
            "generate 5 complex and insightful business-related questions that someone might ask. "
            "Return only a **pure JSON array** of question strings. Do not include markdown.\n\n"
            f"Columns: {columns}\n\n"
            f"Data Types: {types}\n\n"
            f"Sample Rows: {sample}"
        )    
        response = llm.invoke(prompt)  # type: ignore
        content = getattr(response, "content", response)
        content = content.strip() # type: ignore
        
        if "```" in content:
            content = content.split("```")[1].strip()       
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()
        try:
            questions = json.loads(content)
            if not isinstance(questions, list):
                raise ValueError("Expected a list of questions.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse questions as JSON list: {str(e)}")      
        text_chunks = [json.dumps(row, default=str) for row in df.to_dict(orient="records")]
        vectors = embedding.embed_documents(text_chunks)      
        DuckDB.from_texts(
            texts=text_chunks,
            embedding=embedding,
            connection=duckdb_connection,  
            table_name=EMBED_TABLE,
            distance_strategy=DistanceStrategy.COSINE
        )
        return {
            "status": "Upload complete. Data and embeddings stored in DuckDB.",
            "generated_questions": questions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

#/. Upload file to Duckdb and Generate Query



