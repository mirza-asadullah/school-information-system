from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        description="School Information System API",
    )

    import os
    allowed_origins = ["http://localhost:5173"]
    env_origins = os.getenv("CORS_ORIGINS")
    allow_creds = True
    if env_origins:
        # If "*" is set, allow all origins and disable credentials support to prevent crash
        if "*" in env_origins:
            allowed_origins = ["*"]
            allow_creds = False
        else:
            allowed_origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=allow_creds,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()