from fastapi import  FastAPI
from fastapi.middleware.cors import  CORSMiddleware
from app.routers import message
from app.routers.file_router import upload_router
from app.routers import env_router
from app.routers.query_route import query_router
# from app.dbanalysis.libsqllitedb.sqllite_file_router import sqllite_upload_router

app= FastAPI(
title="API",
    description="This API powers the Data Chat app .",
    version="1.0.0",    
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)

app.include_router(message.router, prefix="/api")
#app.include_router(file_router.upload_router, prefix="/api")
app.include_router(upload_router, prefix="/api", tags=["File Uploads"]) #cloud
app.include_router(env_router.router, prefix="/api", tags=["Environment"])
app.include_router(query_router,prefix="/api", tags=["Query"]) #cloud
# app.include_router(sqllite_upload_router,prefix="/api",tags=["SQLLite Upload"])
# @app.get("/api/message")
# def get_massage():
#     return {"message": "Hello from My FastAPI"}
