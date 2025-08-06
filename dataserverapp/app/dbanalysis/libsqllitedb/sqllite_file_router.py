from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.dbanalysis.libsqllitedb.sllite_file_service import save_upload_file,save_upload_file_and_store

sqllite_upload_router = APIRouter()

@sqllite_upload_router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    path = await save_upload_file(file)
    return {"message": "File uploaded", "path": path}

@sqllite_upload_router.post("/upload-and-store")
async def upload_and_store(file: UploadFile = File(...)):
    try:
        result = await save_upload_file_and_store(file)
        return JSONResponse(content=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
