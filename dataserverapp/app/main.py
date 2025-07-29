from fastapi import  FastAPI
from fastapi.middleware.cors import  CORSMiddleware
from app.routers import message
from app.routers.file_router import upload_router
from app.routers import env_router
from app.routers.query_route import query_router


app= FastAPI(
title="API",
    description="This API powers the Employee Profile app .",
    version="1.0.0",
    docs_url="/docs",             
    redoc_url="/redoc",           
    openapi_url="/openapi.json",  
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(message.router, prefix="/api")
#app.include_router(file_router.upload_router, prefix="/api")
app.include_router(upload_router, prefix="/api", tags=["File Uploads"])
app.include_router(env_router.router, prefix="/api", tags=["Environment"])
app.include_router(query_router,prefix="/api", tags=["Query"])

# @app.get("/api/message")
# def get_massage():
#     return {"message": "Hello from My FastAPI"}
#
# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: Union[str, None] = None):
#
#     return {"item_id": item_id, "q": q}