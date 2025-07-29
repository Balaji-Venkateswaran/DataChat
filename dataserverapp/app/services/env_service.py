import os
from dotenv import load_dotenv 

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

def get_env_vars() -> dict:
    return {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        "ENV_MODE": os.getenv("ENV_MODE")
    }