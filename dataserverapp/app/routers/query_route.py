from fastapi import APIRouter, Query, Response
from pydantic import BaseModel
from typing import Optional
from app.services.query_service import generate_sql_and_table,generate_sql_and_table_bycontext,download_query_results

query_router = APIRouter()

class QueryRequest(BaseModel):
    context: Optional[str] = None
    # sqltext: Optional[str] = None
    question: str  
    
class SQLQuery(BaseModel):
    sql_text: str
    
@query_router.post("/sql-query")
async def query_llm(request: QueryRequest):
    return await generate_sql_and_table(request.question)

DEFAULT_CONTEXT = """This table stores uploaded file metadata:
- filename: name of the uploaded file
- filepath: local/cloud path
- filetype: csv or xlsx (stored in lowercase like 'csv', 'xlsx')
- columns: comma-separated inferred columns
- uploaded_at: upload timestamp
- content_text: full text content
- embedding: vector for search
Use LOWER(column_name) = 'value' for filtering string values to ensure case-insensitivity.
"""

@query_router.post("/sql-query-context-question")
async def query_llm_context(request: QueryRequest):
    context = request.context or DEFAULT_CONTEXT
    return await generate_sql_and_table_bycontext(context, request.question)


@query_router.post("/download-results")
async def download_results(query: SQLQuery):
    sql = query.sql_text
    try:
        result = download_query_results(sql)
        if result:
            return result
        else:
            return Response(content="No data found.", media_type="text/plain", status_code=204)
    except Exception as e:
        return {"detail": str(e)}