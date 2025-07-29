from fastapi import APIRouter, UploadFile, File
from app.services.file_service import save_upload_file
from fastapi.responses import JSONResponse

upload_router = APIRouter()

@upload_router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_path = await save_upload_file(file)
    return JSONResponse({
        "message": "File uploaded successfully",
        "filename": file.filename,
        "saved_to": file_path
    })
