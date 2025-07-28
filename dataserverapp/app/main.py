from fastapi import  FastAPI
from fastapi.middleware.cors import  CORSMiddleware
from app.routers import message

app= FastAPI(
title="API",
    description="This API powers the Employee Profile app .",
    version="1.0.0",
    docs_url="/docs",             # Optional: customize docs path
    redoc_url="/redoc",           # Optional: ReDoc path
    openapi_url="/openapi.json",  # Optional: customize openapi path
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(message.router, prefix="/api")

# @app.get("/api/message")
# def get_massage():
#     return {"message": "Hello from My FastAPI"}
#
# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: Union[str, None] = None):
#
#     return {"item_id": item_id, "q": q}