from fastapi import APIRouter
from pydantic import BaseModel
from app.services.query_service import generate_sql_and_table

query_router = APIRouter()

class QueryRequest(BaseModel):
    question: str

@query_router.post("/sql-query")
async def query_llm(request: QueryRequest):
    return await generate_sql_and_table(request.question)
