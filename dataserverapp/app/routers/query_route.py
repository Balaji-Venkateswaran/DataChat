from fastapi import APIRouter, Query, Response,HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.query_service  import getdata_from_multi_file_duckdb,QueryRequestDuck,QueryResponseContext
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Any, Dict


query_router = APIRouter()
class QueryRequest(BaseModel):
    context: Optional[str] = None 
    # sqltext: Optional[str] = None
    question: str  
    
# class QueryRequestDuck(BaseModel):
#     context: Optional[str] = None 
#     # sqltext: Optional[str] = None
#     question: str  
    
class SQLQuery(BaseModel):
    sql_text: str   


    
@query_router.post("/getdata_from_duckdb_muulti_context", response_model=QueryResponseContext)
async def getdata_from_duckdb_context(request: QueryRequestDuck) -> Dict[str, Any]:
    """
    Handles queries from the frontend, processes them using the context and question,
    and returns SQL, table data, etc.
    """
    try:       
        result = await getdata_from_multi_file_duckdb(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))