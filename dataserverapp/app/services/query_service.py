#inbuild
import os
from fastapi import HTTPException
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client
import re
import io
import base64
import matplotlib.pyplot as plt
from typing import Any, Dict, List
from pydantic import BaseModel
from langchain_community.vectorstores import DuckDB
import duckdb
from typing import Optional,Dict,Any
from io import BytesIO
from langchain_community.vectorstores import DuckDB
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain_community.chat_models import ChatOllama
import asyncio
import logging
#/. models
class QueryRequestContext(BaseModel):
    context: str
    question: str
    chart_type: str

class QueryResponseContext(BaseModel):
    file_id: str
    filename: Optional[str] = None
    sql: str
    table_html: str
    excel_base64: str
    chart_image_base64: str    
class QueryRequestDuck(BaseModel):
    context: Optional[str] = None 
    # sqltext: Optional[str] = None
    question: str 
    chart_type: Optional[str] = None 
    selected_llm_model : Optional[str] = None
    
output_parser = StrOutputParser()
#/. config
ROOT_DIR = os.path.join(os.getcwd(), "database")
#os.makedirs(ROOT_DIR, exist_ok=True)  
DUCKDB_PATH = os.path.join(ROOT_DIR, "vectordb.duckdb")
TABLE_NAME = "vectordb_data"
EMBED_TABLE = "vectordb_embeddings"
# if os.path.exists(DUCKDB_PATH):
#     os.remove(DUCKDB_PATH)
duckdb_connection = duckdb.connect(DUCKDB_PATH,read_only=False)
ollama_embedding  = OllamaEmbeddings(model="bge-m3", base_url="http://127.0.0.1:11434")
ollama_llm = Ollama(model="llama3:8b", base_url="http://127.0.0.1:11434")
ollama_llm_chat = ChatOllama(
    model="llama3:8b",  
    base_url="http://127.0.0.1:11434",
    temperature=0.2
)
# prompt_template = PromptTemplate.from_template("""
# You are a SQL generator assistant. Generate a safe and minimal SELECT SQL query for the question below. 
# Use only the columns and table described in the schema. Consider the user context as background knowledge.

# Schema:
# {schema}

# Context (background information from the user, may help constrain or guide the query):
# {context}

# Question (natural language question to convert to SQL):
# {question}

# Only return a valid SQL SELECT statement without explanation.
# """)
#/.logger
# logger = logging.getLogger("vectordb")
# logger.setLevel(logging.DEBUG)
#/.functions  
def clean_sql_output(text: str) -> str:   
    text = re.sub(r"```sql", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)
    return text.strip()

def sanitize_question(q: str) -> str:
    return q.replace("'", "").replace("`", "").strip()

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

def dataframe_to_excel_base64(df: pd.DataFrame) -> str:     #improvement required
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode()
def create_chart_from_dataframe(df: pd.DataFrame, chart_type: str) -> str:
    """
    Generates a chart (bar, line, or pie) from the DataFrame and returns it
    as a base64-encoded PNG image.
    If no numeric data is present, it will count occurrences of a categorical
    column to generate a bar chart.
    """
    if df.empty:
        print("DataFrame is empty, cannot generate chart.")
        return ""
    try:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=['number']).columns.tolist()

        # Special case: If only categorical data is available, count occurrences of the first column
        if not numeric_cols and categorical_cols:
            count_series = df[categorical_cols[0]].value_counts().reset_index()
            count_series.columns = ['Category', 'Count']
            df = count_series
            numeric_cols = ['Count']
            categorical_cols = ['Category']
            chart_type = 'bar' 

        
        if not numeric_cols or not categorical_cols:
            print("Not enough suitable columns for a chart, even after counting.")
            return ""

        labels_col = categorical_cols[0]
        data_col = numeric_cols[0]

    
        plt.clf()
        fig, ax = plt.subplots(figsize=(10, 6))

        if chart_type == 'bar':
           
            if len(df[labels_col]) > 20:
                df = df.sort_values(by=data_col, ascending=False).head(20)
            ax.bar(df[labels_col], df[data_col])
            ax.set_ylabel(data_col)
            ax.set_xlabel(labels_col)
            ax.set_title(f"Count of {labels_col}")
            plt.xticks(rotation=45, ha='right')
        elif chart_type == 'line':
          
            ax.plot(df[labels_col], df[data_col], marker='o')
            ax.set_ylabel(data_col)
            ax.set_xlabel(labels_col)
            ax.set_title(f"{chart_type.capitalize()} Chart: {data_col} by {labels_col}")
            plt.xticks(rotation=45, ha='right')
        elif chart_type == 'pie':
           
            if len(df[labels_col]) > 10:
                df_sorted = df.sort_values(by=data_col, ascending=False).head(10)
                labels = df_sorted[labels_col].tolist()
                data = df_sorted[data_col].tolist()
            else:
                labels = df[labels_col].tolist()
                data = df[data_col].tolist()
            ax.pie(data, labels=labels, autopct='%1.1f%%', startangle=90)
            ax.axis('equal')
            ax.set_title(f"Distribution by {labels_col}")
        else:
            print(f"Unsupported chart type: {chart_type}")
            return ""

        plt.tight_layout()
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
         return str(e)
        
    return chart_base64
#/.Retrieve data   
#/.normalize
def normalize_duckdb_sql(sql_query: str) -> str:       #more improvement requried to datatype comparation and replace
    """
    Converts common SQL date functions and syntax to DuckDB-compatible syntax.
    Handles DATE_SUB, DATE_ADD, INTERVAL, and EXTRACT conversions.
    """
  
    sql_query = sql_query.replace(
        "DATE_SUB(CURRENT_DATE, INTERVAL", "DATE_ADD(CURRENT_DATE, INTERVAL -"
    )
    sql_query = sql_query.replace(
        "DATE_SUB(CURRENT_TIMESTAMP, INTERVAL", "DATE_ADD(CURRENT_TIMESTAMP, INTERVAL -"
    )
    sql_query = re.sub(
        r"INTERVAL\s+(\d+)\s+(YEAR|MONTH|DAY)",
        lambda m: f"INTERVAL '{m.group(1)} {m.group(2).lower()}'",
        sql_query,
        flags=re.IGNORECASE,
    )

    sql_query = re.sub(
        r"CURRENT_DATE\s*-\s*INTERVAL\s*'(\d+\s+\w+)'",
        r"DATE_ADD(CURRENT_DATE, -INTERVAL '\1')",
        sql_query,
        flags=re.IGNORECASE,
    )


    sql_query = re.sub(
        r"CURRENT_TIMESTAMP\s*-\s*INTERVAL\s*'(\d+\s+\w+)'",
        r"DATE_ADD(CURRENT_TIMESTAMP, -INTERVAL '\1')",
        sql_query,
        flags=re.IGNORECASE,
    )
    sql_query = re.sub(
        r"EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\)",
        r"CAST(strftime('%Y', \1) AS INTEGER)",
        sql_query,
        flags=re.IGNORECASE,
    )

    sql_query = re.sub(
        r"EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\)",
        r"CAST(strftime('%m', \1) AS INTEGER)",
        sql_query,
        flags=re.IGNORECASE,
    )

    sql_query = re.sub(
        r"EXTRACT\s*\(\s*DAY\s+FROM\s+([^)]+)\)",
        r"CAST(strftime('%d', \1) AS INTEGER)",
        sql_query,
        flags=re.IGNORECASE,
    )

    return sql_query.strip()



def sanitize_sql_query(query: str) -> str:
    """
    Detect invalid usage of window functions in WHERE clauses and
    rewrite query into a CTE so DuckDB accepts it.
    """
    window_funcs = ["LAG", "LEAD", "ROW_NUMBER", "RANK", "DENSE_RANK"]

    if any(func in query.upper() for func in window_funcs):
       
        if re.search(r"WHERE\s+.*(LAG|LEAD|ROW_NUMBER|RANK|DENSE_RANK)",
                     query, re.IGNORECASE | re.DOTALL):
            match = re.search(r"SELECT\s+(.*)\s+FROM\s+(\w+)",
                              query, re.IGNORECASE | re.DOTALL)
            if match:
                select_cols, table = match.groups()
                cte = f"""
                WITH windowed AS (
                    SELECT {select_cols}
                    FROM {table}
                )
                SELECT *
                FROM windowed
                WHERE 1=1
                """
                where_match = re.search(r"WHERE\s+(.*)", query,
                                        re.IGNORECASE | re.DOTALL)
                if where_match:
                    where_clause = where_match.group(1)
                    cte = cte.replace("WHERE 1=1", f"WHERE {where_clause}")
                return cte.strip()

    return query.strip()


#/.retrieve
async def getdata_from_multi_file_duckdb(payload) -> dict:  #improvment required-test version only
    try:
        chart_type = getattr(payload, "chart_type", "bar")
        question = payload.question
       
        vs = DuckDB(
            embedding=ollama_embedding,
            connection=duckdb_connection,
            table_name=EMBED_TABLE,
        )

        docs = vs.similarity_search(question, k=3)
        if not docs:
            raise HTTPException(status_code=404, detail="No relevant documents found")

        context_text = "\n".join([doc.page_content for doc in docs])
       
        prompt = (
            f"You are a data analyst. Based on the context and table name below, "
            f"write an optimized DuckDB-compatible SQL query that answers the user question.\n\n"
            f"Context (sample rows):\n{context_text}\n\n"
            f"Table name: {TABLE_NAME}\n\n"
            f"User Question: {question}\n\n"
            f"Only return the SQL query. No explanation."
        )

        response = ollama_llm.invoke(prompt)
        sql_query = getattr(response, "content", response).strip()

      
        if "```" in sql_query:
            sql_query = sql_query.replace("```sql", "").replace("```python", "").replace("```", "").strip()
        
        sql_query = re.sub(
            r"PERCENTILE_CONT\(([^)]+)\)\s*WITHIN GROUP\s*\(ORDER BY ([^)]+)\)",
            r"QUANTILE_CONT(\2, \1)",
            sql_query,
            flags=re.IGNORECASE
        )
      
        def replace_datediff(match):
            args = match.group(1).split(",")
            if len(args) == 2:
                return f"DATEDIFF('day', {args[0].strip()}, {args[1].strip()})"
            return match.group(0)
        sql_query = re.sub(r"DATEDIFF\s*\(([^)]+)\)", replace_datediff, sql_query, flags=re.IGNORECASE)

       
        sql_query = re.sub(
            r"DATE_SUB\s*\(\s*([^\s,]+)\s*,\s*INTERVAL\s*([^)]+)\)",
            r"DATE_ADD(\1, INTERVAL -\2)",
            sql_query,
            flags=re.IGNORECASE
        )

       
        sql_query = re.sub(
            r"CURRENT_DATE\s*-\s*INTERVAL\s*([^\s]+)",
            r"DATE_ADD(CURRENT_DATE, INTERVAL -\1)",
            sql_query,
            flags=re.IGNORECASE
        )

      
        sql_query = sanitize_sql_query(normalize_duckdb_sql(sql_query))
          #improvment req
        try:
            result_df = duckdb_connection.execute(sql_query).fetchdf()
        except duckdb.Error as inner_e:
            error_msg = str(inner_e).lower()

            if "must appear in the group by clause" in error_msg:
               
                fixed_query = re.sub(
                    r"select\s+(.*?)\s+from",
                    lambda m: "SELECT " + ", ".join([
                        f"ANY_VALUE({col.strip()})"
                        if not re.search(r"(sum|avg|count|min|max|corr|quantile|median)", col.strip(), re.I)
                        else col.strip()
                        for col in m.group(1).split(",")
                    ]) + " FROM",
                    sql_query,
                    flags=re.I | re.S
                )
               
                result_df = duckdb_connection.execute(fixed_query).fetchdf()
                sql_query = fixed_query

            elif "aggregate function calls cannot contain window function calls" in error_msg:
                fixed_query = f"WITH base AS ({sql_query}) SELECT * FROM base"
                # logger.debug(f"Auto-fixed nested window aggregation SQL:\n{fixed_query}")
                result_df = duckdb_connection.execute(fixed_query).fetchdf()
                sql_query = fixed_query
            else:
                raise

        if result_df.empty:
            return {
                "file_id": "",
                "sql": sql_query,
                "table_html": "",
                "excel_base64": "",
                "chart_image_base64": ""
            }
       #existed changes -previous version
        buffer = BytesIO() 
        result_df.to_excel(buffer, index=False, engine="openpyxl")
        buffer.seek(0)
        excel_base64 = base64.b64encode(buffer.read()).decode("utf-8")

        
        chart_image_base64 = create_chart_from_dataframe(result_df, chart_type)

        return {
            "file_id": "",
            "sql": sql_query,
            "table_html": dataframe_to_html_table(result_df).strip(),
            "excel_base64": excel_base64,
            "chart_image_base64": chart_image_base64
        }

    except duckdb.Error as e:
        raise HTTPException(status_code=500, detail=f"DuckDB Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
#/. retrive data