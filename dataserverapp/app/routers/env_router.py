from fastapi import APIRouter
from app.services.env_service import get_env_vars

router = APIRouter()

@router.get("/get-env")
def read_env():
    return get_env_vars()
