from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.file_service import save_upload_file,save_upload_file_and_store, save_upload_file_and_store_context

upload_router = APIRouter()

@upload_router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_path = await save_upload_file(file)
    return JSONResponse({
        "message": "File uploaded successfully",
        "filename": file.filename,
        "saved_to": file_path
    })

@upload_router.post("/upload-and-store")
async def upload_and_store_file(file: UploadFile = File(...)):
    try:
        result = await save_upload_file_and_store(file)
        return JSONResponse(content=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@upload_router.post("/upload-and-store-context")
async def upload_and_store_file_context(file: UploadFile = File(...)):
    try:
        result = await save_upload_file_and_store_context(file)
        return JSONResponse(content=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    
    
  