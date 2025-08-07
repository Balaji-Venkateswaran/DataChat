from fastapi import APIRouter, Query, Response,HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.query_service  import (generate_sql_and_table,generate_sql_and_table_bycontext,download_query_results,process_question_and_query_by_context_and_question,QueryRequestContext,QueryResponseContext)
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Any, Dict
query_router = APIRouter()
from app.services.query_service import download_query_results,process_question_and_query_by_context_and_question



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
    
    # updated code for auto response by contenxt( using id)
    
class QueryRequestContext(BaseModel):
    context: str
    question: str

class QueryResponseContext(BaseModel):
    file_id: str
    sql: str
    table_html: str
    excel_base64: str
 

# This imports the correct models and functions from the updated service file.
from app.services.query_service import (
    process_question_and_query_by_context_and_question,
    QueryRequestContext,
    QueryResponseContext
)

query_router = APIRouter()

# --- API Endpoints ---

@query_router.post("/query-by-context-auto-id", response_model=QueryResponseContext)
def query_by_context(request: QueryRequestContext) -> Dict[str, Any]:
    """
    Handles queries from the frontend, processes them using the context and question,
    and returns SQL, an HTML table, Excel data, and a chart image.
    """
    try:
        result = process_question_and_query_by_context_and_question(
            context=request.context,
            question=request.question,
            chart_type=request.chart_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))