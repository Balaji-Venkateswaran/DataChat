# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.routers.file_router import upload_router
# from app.database import initialize_db
# from app.routers.query_route import query_router


# app = FastAPI(title="Data Chat App")

# # Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Routers
# app.include_router(upload_router, prefix="/api", tags=["File Upload"])
# app.include_router(query_router, prefix="/api", tags=["Query"])


# # Initialize SQLite DB on startup
# @app.on_event("startup")
# def startup_event():
#     initialize_db()
