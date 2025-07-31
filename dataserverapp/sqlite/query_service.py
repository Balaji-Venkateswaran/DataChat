import sqlite3
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from langchain_google_genai import GoogleGenerativeAIEmbeddings


def query_documents(question: str) -> str:
    conn = sqlite3.connect("file_data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, content_text, embedding FROM documents")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        raise Exception("No documents found in SQLite.")

    # Get embedding for the question
    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    try:
        q_vector = embedding_model.embed_query(question)
    except Exception as e:
        raise Exception(f"Embedding failed: {e}")

    # Compare with each stored document
    best_score = -1
    best_doc = None

    for row in rows:
        try:
            doc_embedding = np.array(json.loads(row[3])).reshape(1, -1)
            score = cosine_similarity([q_vector], doc_embedding)[0][0]
            if score > best_score:
                best_score = score
                best_doc = {
                    "filename": row[1],
                    "content": row[2],
                    "score": score
                }
        except Exception as e:
            continue  # skip bad rows

    if not best_doc:
        raise Exception("No match found.")

    return best_doc["content"][:500]  
