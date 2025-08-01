from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.services.query_service import query_documents

query_router = APIRouter()

# ------------------------------
# 🧠 Model Definitions
# ------------------------------
class QAInput(BaseModel):
    context: str
    question: str

class QueryRequest(BaseModel):
    question: str

# ------------------------------
# 🔸 Gemini Setup (for /ask-single)
# ------------------------------
llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-flash-latest", temperature=0.2)
output_parser = StrOutputParser()

qa_prompt = PromptTemplate.from_template("""
You are a helpful assistant. Use the following context to answer the user's question.

Context:
{context}

Question:
{question}

Answer:
""")

qa_chain = qa_prompt | llm | output_parser

# ------------------------------
# 🧠 1. Batch QA Endpoint (/ask)
# ------------------------------
@query_router.post("/ask")
async def ask_batch(queries: List[QAInput]):
    results = []
    for item in queries:
        try:
            answer = query_documents(item.question)
            results.append({
                "context": item.context,
                "question": item.question,
                "answer": answer
            })
        except Exception as e:
            results.append({
                "context": item.context,
                "question": item.question,
                "error": str(e)
            })
    return {"results": results}

# ------------------------------
# 💬 2. Single Vector Query (/query)
# ------------------------------
@query_router.post("/query")
def query_data(req: QueryRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is empty.")

    conn = sqlite3.connect("file_data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, content_text, embedding FROM documents")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No documents found.")

    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    try:
        q_vector = embedding_model.embed_query(question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    best_score = -1
    best_doc = None
    for row in rows:
        try:
            emb = np.array(json.loads(row[3])).reshape(1, -1)
            score = cosine_similarity([q_vector], emb)[0][0]
            if score > best_score:
                best_score = score
                best_doc = {
                    "id": row[0],
                    "filename": row[1],
                    "content": row[2],
                    "score": score
                }
        except:
            continue

    if not best_doc:
        raise HTTPException(status_code=404, detail="No match found.")

    return {
        "matched_file": best_doc["filename"],
        "similarity_score": round(best_doc["score"], 3),
        "matched_content": best_doc["content"][:1000] + "..."
    }

# ------------------------------
# ❓ 3. Ask One QA via Gemini (/ask-single)
# ------------------------------
@query_router.post("/ask-single")
async def ask_single(query: QAInput):
    try:
        response = qa_chain.invoke({
            "context": query.context,
            "question": query.question
        })
        return {
            "context": query.context,
            "question": query.question,
            "answer": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini Error: {str(e)}")
