from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from app.services.file_service import upload_multi_file_store_duckdb

upload_router = APIRouter()  
    
@upload_router.post("/upload_multifile_and_store_duckdb")
async def upload_multifile_and_store_duckdb(files: List[UploadFile] = File(...)):
    """
    Upload multiple files, store them into DuckDB, and generate queries.
    """
    try:
        result = await upload_multi_file_store_duckdb(files)
        return JSONResponse(content=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    