#/.inbuilt
import os
import shutil
from fastapi import UploadFile, HTTPException
import pandas as pd
import json
import duckdb
from langchain_community.vectorstores import DuckDB
from pathlib import Path
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from typing import List, Dict,Any
import re
#/.users
from app.utilities.safe_json_extract import safe_json_extract
#/.config
UPLOAD_DIR = "uploads"
UPLOAD_DIR_MULTI = Path(UPLOAD_DIR)
UPLOAD_DIR_MULTI.mkdir(exist_ok=True)
ollama_embedding  = OllamaEmbeddings(model="bge-m3", base_url="http://127.0.0.1:11434")
ollama_llm = Ollama(model="llama3:8b", base_url="http://127.0.0.1:11434")
ROOT_DIR = os.path.join(os.getcwd(), "database")
os.makedirs(ROOT_DIR, exist_ok=True)  
DUCKDB_PATH = os.path.join(ROOT_DIR, "vectordb.duckdb")
TABLE_NAME = "vectordb_data"
EMBED_TABLE = "vectordb_embeddings"
if os.path.exists(DUCKDB_PATH):
    os.remove(DUCKDB_PATH)
duckdb_connection = duckdb.connect(DUCKDB_PATH,read_only=False)
#/. functions

#/. Upload muiti file to Duckdb and Generate Query */   
def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Clean dataframe before storing to DuckDB"""
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            # Convert datetime to string format and replace NaT with None
            df[col] = df[col].dt.strftime("%Y-%m-%d %H:%M:%S")
            df[col] = df[col].where(df[col].notna(), None)
        elif pd.api.types.is_numeric_dtype(df[col]):
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

def sanitize_sql_query(query: str) -> str:
    """
    Detect invalid usage of window functions in WHERE clauses and
    rewrite query into a CTE so DuckDB accepts it.
    """
    window_funcs = ["LAG", "LEAD", "ROW_NUMBER", "RANK", "DENSE_RANK"]

    if any(func in query.upper() for func in window_funcs):
        #
        if re.search(r"WHERE\s+.*(LAG|LEAD|ROW_NUMBER|RANK|DENSE_RANK)", query,
                     re.IGNORECASE | re.DOTALL):

            
            match = re.search(r"SELECT\s+(.*)\s+FROM\s+(\w+)",
                              query, re.IGNORECASE | re.DOTALL)
            if match:
                select_cols, table = match.groups()
                cte = f"""
                WITH windowed AS (
                    SELECT {select_cols}
                    FROM {table}
                )
                SELECT *
                FROM windowed
                WHERE 1=1
                """
               
                where_match = re.search(r"WHERE\s+(.*)", query,
                                        re.IGNORECASE | re.DOTALL)
                if where_match:
                    where_clause = where_match.group(1)
                    cte = cte.replace("WHERE 1=1", f"WHERE {where_clause}")
                return cte.strip()

    return query.strip()
 
async def upload_multi_file_store_duckdb(files: List[UploadFile]) -> Dict[str, Any]:
    combined_df = pd.DataFrame()
   
    for file in files:
        try:
            file_path = UPLOAD_DIR_MULTI / file.filename  # type: ignore
            print("Saving file:", file_path)
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)

            ext = file.filename.split(".")[-1].lower()  # type: ignore

            if ext == "csv":
                df = pd.read_csv(file_path)

            elif ext in ["xls", "xlsx"]:
                # Read all sheets
                excel_data = pd.read_excel(file_path, sheet_name=None)
                sheet_dfs = []
                for sheet_name, sheet_df in excel_data.items():
                    if not sheet_df.empty:
                        sheet_df["__source_file"] = file.filename
                        sheet_df["__sheet_name"] = sheet_name
                        sheet_dfs.append(sheet_df)
                df = pd.concat(sheet_dfs, ignore_index=True) if sheet_dfs else pd.DataFrame()

            else:
                raise HTTPException(status_code=400,
                                    detail=f"Unsupported file type: {file.filename}")

            if not df.empty:
                df["__source_file"] = file.filename
                combined_df = pd.concat([combined_df, df], ignore_index=True)

        except Exception as e:
            raise HTTPException(status_code=500,
                                detail=f"Failed to process {file.filename}: {str(e)}")

    if combined_df.empty:
        raise HTTPException(status_code=400,
                            detail="No valid data found in uploaded files.")

    
    existing_tables = [t[0] for t in duckdb_connection.execute("SHOW TABLES").fetchall()]
    if TABLE_NAME in existing_tables:
        duckdb_connection.execute(f"DROP TABLE {TABLE_NAME}")
    if EMBED_TABLE in existing_tables:
        duckdb_connection.execute(f"DROP TABLE {EMBED_TABLE}")

   
    duckdb_connection.register("combined_df_view", combined_df)
    duckdb_connection.execute(f"CREATE TABLE {TABLE_NAME} AS SELECT * FROM combined_df_view")
    duckdb_connection.unregister("combined_df_view")

    
    columns = combined_df.columns.tolist()
    types = combined_df.dtypes.astype(str).tolist()
    sample = json.loads(combined_df.head(3).to_json(orient="records", date_format="iso"))

    prompt = (
        "You are a data analyst. Based on the dataset schema and sample rows below, "
        "generate 5 complex and insightful business-related questions that someone might ask. "
        "Return only a pure JSON array of question strings. Do not include markdown.\n\n"
        f"Columns: {columns}\n\n"
        f"Data Types: {types}\n\n"
        f"Sample Rows: {sample}"
    )

   
    try:
        response = ollama_llm.invoke(prompt)
        content = getattr(response, "content", response).strip()
        questions = safe_json_extract(content)
        if not questions:
            raise ValueError(f"Ollama did not return valid questions. Raw content: {content[:200]}...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse questions: {str(e)}")

   
    safe_questions = [sanitize_sql_query(q) for q in questions]
   
    text_chunks = [json.dumps(row, default=str) for row in combined_df.to_dict(orient="records")]
    DuckDB.from_texts(
        texts=text_chunks,
        embedding=ollama_embedding,
        connection=duckdb_connection,
        table_name=EMBED_TABLE
    )

    return {
        "status": "Upload complete. Data and embeddings stored in DuckDB.",
        "generated_questions": safe_questions
    }

#/.working code commented for future usage

# async def upload_multi_file_store_duckdb(files: List[UploadFile]) -> Dict[str, Any]:
#     combined_df = pd.DataFrame()

#     # Save + read all files
#     for file in files:
#         try:
#             file_path = UPLOAD_DIR_MULTI / file.filename  # type: ignore
#             print("Saving file:", file_path)
#             with open(file_path, "wb") as f:
#                 shutil.copyfileobj(file.file, f)

#             ext = file.filename.split(".")[-1].lower()  # type: ignore
#             if ext == "csv":
#                 df = pd.read_csv(file_path)
#             elif ext in ["xls", "xlsx"]:
#                 excel_data = pd.read_excel(file_path, sheet_name=None)
#                 df = pd.concat(excel_data.values(), ignore_index=True)
#             else:
#                 raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.filename}")

#             combined_df = pd.concat([combined_df, df], ignore_index=True)

#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to process {file.filename}: {str(e)}")

#     if combined_df.empty:
#         raise HTTPException(status_code=400, detail="No valid data found in uploaded files.")

#     
#     existing_tables = [t[0] for t in duckdb_connection.execute("SHOW TABLES").fetchall()]
#     if TABLE_NAME in existing_tables:
#         duckdb_connection.execute(f"DROP TABLE {TABLE_NAME}")
#     if EMBED_TABLE in existing_tables:
#         duckdb_connection.execute(f"DROP TABLE {EMBED_TABLE}")

#   
#     duckdb_connection.execute(f"CREATE TABLE {TABLE_NAME} AS SELECT * FROM combined_df")

#   
#     columns = combined_df.columns.tolist()
#     types = combined_df.dtypes.astype(str).tolist()
#     sample = json.loads(combined_df.head(3).to_json(orient="records", date_format="iso"))

#     prompt = (
#         "You are a data analyst. Based on the dataset schema and sample rows below, "
#         "generate 5 complex and insightful business-related questions that someone might ask. "
#         "Return only a pure JSON array of question strings. Do not include markdown.\n\n"
#         f"Columns: {columns}\n\n"
#         f"Data Types: {types}\n\n"
#         f"Sample Rows: {sample}"
#     )

#   
#     try:
#         response = ollama_llm.invoke(prompt)
#         content = getattr(response, "content", response).strip()
#         questions = safe_json_extract(content)
#         if not questions:
#             raise ValueError(f"Ollama did not return valid questions. Raw content: {content[:200]}...")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to parse questions: {str(e)}")

#    
#     text_chunks = [json.dumps(row, default=str) for row in combined_df.to_dict(orient="records")]
#     DuckDB.from_texts(
#         texts=text_chunks,
#         embedding=ollama_embedding,
#         connection=duckdb_connection,
#         table_name=EMBED_TABLE
#     )

#     return {
#         "status": "Upload complete. Data and embeddings stored in DuckDB.",
#         "generated_questions": questions
#     }