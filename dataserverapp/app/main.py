#inbuild
from fastapi import  FastAPI
from fastapi.middleware.cors import  CORSMiddleware
from app.routers.file_router import upload_router
from app.routers.query_route import query_router
#/.config
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
#/.redirect path
app.include_router(upload_router, prefix="/api", tags=["Uploads"]) 
app.include_router(query_router,prefix="/api", tags=["Query"]) 
# @app.get("/api/message")
# def get_massage():
#     return {"message": "Hello from My FastAPI"}
