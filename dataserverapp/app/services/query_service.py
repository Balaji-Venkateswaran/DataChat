# service.py

import os
from fastapi import HTTPException
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
import pandas as pd
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.vectorstores.supabase import SupabaseVectorStore
from dotenv import load_dotenv
from supabase import create_client, Client
import re

# Load .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLENAME = os.getenv("SUPABASE_TABLE_NAME")
SUPABASE_FUNCTION_NAME = os.getenv("SUPABASE_FUNCTION_NAME")
if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_TABLENAME:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY and SUPABASE_TABLENAME environment variables must be set.")
if not GOOGLE_API_KEY:    
    raise ValueError("Api Key issue")
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
#llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)
supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_vector_store = SupabaseVectorStore(
    embedding=embedding,
    client=supabase_client,
    table_name=SUPABASE_TABLENAME,
    query_name=SUPABASE_FUNCTION_NAME
)
output_parser = StrOutputParser()
sql_prompt_template = PromptTemplate.from_template("""
        You are an expert SQL generator. Given a question and the following table schema:

        Table: file_documents(
            id UUID,
            filename TEXT,
            content_text TEXT,
            columns TEXT,
            embedding VECTOR(1536),
            created_at TIMESTAMP
        )

        Follow these rules:
        - Use proper SQL syntax.
        - Map 'name' to 'filename'.
        - Remove extra or unmatched quotes from input.
        - Output only a valid SQL query. Do not wrap it in markdown or backticks.

        User Question: {question}

        SQL:
""")
async def generate_sql_and_table(user_question: str):
    user_question = sanitize_question(user_question)
    try:
        schema = """
            file_documents(
                id uuid,
                filename TEXT,
                content_text TEXT,
                columns TEXT,
                embedding VECTOR(1536),
                created_at TIMESTAMP
            )
            """    
        prompt = sql_prompt_template.format(schema=schema, question=user_question) 
        chain = sql_prompt_template | llm | output_parser
        response = chain.invoke({"schema": schema, "question": user_question})        
        # sql_query =response.content.strip("`").strip() #type:ignore
        print(f"result is :{response}")
        sql_query = clean_sql_output(response)
        print(f"sql_query :{sql_query}")        
        if not sql_query.lower().startswith(("select", "insert", "update", "delete")):
           raise HTTPException(status_code=400, detail="Invalid or unsupported SQL operation.")
        print(f"{sql_query}")       
        sql_query= re.sub(r"\bLIKE\b", "ILIKE", sql_query, flags=re.IGNORECASE)     
        result = supabase_client.rpc("run_sql_query", {"sql_text": sql_query}).execute()
        print(f"result is {result}")
        if not result.data:
            return {"generated_sql": sql_query, "table_html": "<p>No data found</p>"}
        df = pd.DataFrame(result.data)
        table_html = df.to_html(index=False, classes="table table-bordered table-sm")
        return {
            "generated_sql": sql_query,
            "table_html": table_html
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM/SQL error: {str(e)}")
    
    
def clean_sql_output(text: str) -> str:   
    text = re.sub(r"```sql", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)
    return text.strip()

def sanitize_question(q: str) -> str:
    return q.replace("'", "").replace("`", "").strip()