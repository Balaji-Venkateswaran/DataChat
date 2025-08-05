# import os
# import shutil
# from fastapi import UploadFile, HTTPException
# from uuid import uuid4
# from datetime import datetime
# import pandas as pd
# import json
# from dotenv import load_dotenv
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from app.database import get_connection

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# load_dotenv()
# embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# llm_api_key = os.getenv("GOOGLE_API_KEY")
# if not llm_api_key:
#     raise RuntimeError("GOOGLE_API_KEY not set")

# os.environ["GOOGLE_API_KEY"] = llm_api_key

# async def save_upload_file(file: UploadFile) -> str:
#     file_path = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
#     return file_path

# async def save_upload_file_and_store(file: UploadFile):
#     file_ext = os.path.splitext(file.filename)[1].lower()
#     if file_ext not in [".xlsx", ".csv"]:
#         raise HTTPException(status_code=400, detail="Only .csv and .xlsx supported")

#     file_path = await save_upload_file(file)

#     # Load file into DataFrame
#     try:
#         df = pd.read_csv(file_path) if file_ext == ".csv" else pd.read_excel(file_path)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

#     if df.empty:
#         raise HTTPException(status_code=400, detail="Uploaded file is empty.")

#     columns = ",".join(df.columns)
#     content_text = df.to_string(index=False)

#     try:
#         vector = embedding.embed_query(content_text[:8192])
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

#     doc_id = str(uuid4())
#     now = datetime.utcnow().isoformat()

#     conn = get_connection()
#     cursor = conn.cursor()
#     cursor.execute("""
#         INSERT INTO documents (id, filename, filepath, filetype, columns, content_text, embedding, uploaded_at, created_at)
#         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
#     """, (
#         doc_id,
#         file.filename,
#         file_path,
#         file_ext.strip("."),
#         columns,
#         content_text,
#         json.dumps(vector),
#         now,
#         now
#     ))
#     conn.commit()
#     conn.close()

#     return {"message": "File uploaded and stored with embeddings."}
