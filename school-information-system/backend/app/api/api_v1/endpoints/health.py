from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
def ping() -> dict:
    return {"status": "ok", "message": "School Information System API is reachable"}
