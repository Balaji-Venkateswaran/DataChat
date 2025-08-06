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
import csv
import io
from fastapi.responses import StreamingResponse
import base64
import pandasql as psql
from io import StringIO

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
embedding_model = embedding 
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
) #future use
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
        styled_table = df.to_html(index=False, classes="result-custom-table")
        table_html = f'<div class="result-table-container">{styled_table}</div>'        
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


# /. query by context

prompt_template = PromptTemplate.from_template("""
You are a SQL generator assistant. Generate a safe and minimal SELECT SQL query for the question below. 
Use only the columns and table described in the schema. Consider the user context as background knowledge.

Schema:
{schema}

Context (background information from the user, may help constrain or guide the query):
{context}

Question (natural language question to convert to SQL):
{question}

Only return a valid SQL SELECT statement without explanation.
""")

# 🔁 Updated function name and logic
async def generate_sql_and_table_bycontext(user_context: str, user_question: str):
    user_question = sanitize_question(user_question)

    try:
        schema = """
            file_documents(
                id UUID,
                filename TEXT,
                filepath TEXT,
                filetype TEXT,
                columns TEXT,
                uploaded_at TIMESTAMP,
                content_text TEXT,
                embedding VECTOR(1536),
                created_at TIMESTAMP
            )
        """

        # prompt = prompt_template.format(
        #     schema=schema.strip(),
        #     context=(user_context or "").strip(),
        #     question=user_question.strip()
        # )

        # ✅ Use proper chaining with LangChain
        chain = prompt_template | llm | output_parser
        response = chain.invoke({
            "schema": schema.strip(),
            "context": (user_context or "").strip(),
            "question": user_question.strip()
        })

        sql_query = clean_sql_output(response).strip()

        if not sql_query.lower().startswith("select"):
            raise HTTPException(status_code=400, detail="Only SELECT queries are allowed.")

        sql_query = re.sub(r"\bLIKE\b", "ILIKE", sql_query, flags=re.IGNORECASE)
        # print(f"Generated SQL: {sql_query}")
        sql_query = sql_query.replace('\n', ' ')
        result = supabase_client.rpc("run_sql_query_context", {"sql_text": sql_query}).execute()
        print(f"result data is {result.data}")
        if not result.data:
            return {
                "generated_sql": sql_query,
                "table_html": "<p>No matching records found.</p>"
            }

        df = pd.DataFrame(result.data)
        table_html = df.to_html(index=False, classes="result-custom-table")

        return {
            "generated_sql": sql_query,
            "table_html": f'<div class="result-table-container">{table_html}</div>'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
# ./ query by context

#/.download 

def download_query_results(sql_query: str):
    try:
        result = supabase_client.rpc("run_sql_query_context", {"sql_text": sql_query}).execute()
        rows = result.data

        if not rows:
            return None

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=results.csv"}
        )

    except Exception as e:
        raise Exception(f"Error downloading results: {str(e)}")
#./ download 

#/.download for contenxt and questions

def embed_text(text: str) -> list[float]:
    return embedding_model.embed_query(text)

def search_top_file_by_context(question: str, context: str) -> str:
    text_to_embed = f"{question} {context}"
    query_embedding = embed_text(text_to_embed)

    response = supabase_client.rpc("match_documents_centent_by_vector", {
        "query_embedding": query_embedding,
        "match_count": 1
    }).execute()

    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=404, detail="No matching file found.")

    return response.data[0]["id"]

def get_context_from_db(file_id: str) -> dict:
    response = supabase_client.table("file_document_questions") \
        .select("id, filename, columns, content_text") \
        .eq("id", file_id) \
        .single() \
        .execute()

    if response.data is None:
        raise HTTPException(status_code=404, detail="File context not found.")

    return response.data

def generate_sql_from_question(context: dict, question: str) -> str:
    columns = context.get("columns", [])
    table_schema = ", ".join(columns)

    prompt = f"""
    You are a data analyst. Given a table called 'df' with columns: {table_schema}
    Answer the question: "{question}" by generating a SQL SELECT query on the table 'df'.
    Only use the provided columns. Return only the SQL query.
    """
    result = llm.invoke(prompt)
    sql = result.content.strip() if hasattr(result, "content") else str(result).strip()  # type:ignore

    if sql.startswith("```sql"):
        sql = sql.replace("```sql", "").replace("```", "").strip()
    if "employees" in sql:
       sql = sql.replace("employees", "df")
    print(f"Generated SQL query:\n{sql}")
    return sql

def run_sql_query_on_csv(content_text: str, sql: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(StringIO(content_text))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing failed: {e}")

    try:
        result_df = psql.sqldf(sql, {"df": df})
        if result_df is None or not isinstance(result_df, pd.DataFrame):
            raise ValueError("SQL execution returned no data.")
        return result_df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL Execution failed: {e}")

def dataframe_to_html_table(df: pd.DataFrame) -> str:
    table_html = df.to_html(
        index=False,
        classes="table table-bordered table-striped table-hover result-custom-table"
    )
    container = f"""
    <div id="result-table-container" class="table-responsive" style="margin-top: 20px;">
        {table_html}
    </div>
    """
    return container

def dataframe_to_excel_base64(df: pd.DataFrame) -> str:
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode()

def process_question_and_query_by_context_and_question(context: str, question: str) -> dict:
    file_id = search_top_file_by_context(question, context)
    context_data = get_context_from_db(file_id)

    sql = generate_sql_from_question(context_data, question)
    df = run_sql_query_on_csv(context_data["content_text"], sql)

    return {
        "file_id": file_id,
        "filename": context_data["filename"],
        "sql": sql,
        "table_html": dataframe_to_html_table(df),
        "excel_base64": dataframe_to_excel_base64(df)
    }
#/.download for context and questions


#/. query service for sql lite/OPENAI





#./ Query Service for sql lite/OPENAI