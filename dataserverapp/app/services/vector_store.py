import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from supabase import create_client, Client
from langchain_community.vectorstores import SupabaseVectorStore
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

embedding = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

llm_api_key = os.getenv("GOOGLE_API_KEY")
if not llm_api_key:
    print("API key required.")
    exit(1)
os.environ["GOOGLE_API_KEY"] = llm_api_key
print(f"api key is {llm_api_key}")

#supabase
#supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_TABLENAME = os.environ.get("SUPABASE_TABLE_NAME")
if not SUPABASE_URL or not SUPABASE_KEY or not SUPABASE_TABLENAME:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY and SUPABASE_TABLENAME environment variables must be set.")

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_vector_store = SupabaseVectorStore(
    embedding=embedding,
    client=supabase_client,
    table_name=SUPABASE_TABLENAME,  
    query_name="match_file_documents" 
)