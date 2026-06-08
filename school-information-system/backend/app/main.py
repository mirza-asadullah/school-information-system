from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

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

    @app.get("/", response_class=HTMLResponse)
    def read_root():
        return """
        <!DOCTYPE html>
        <html>
            <head>
                <title>School Information System API</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Outfit', sans-serif;
                        background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
                        color: #f8fafc;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        overflow: hidden;
                    }
                    .card {
                        background: rgba(30, 41, 59, 0.7);
                        backdrop-filter: blur(16px);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        padding: 40px;
                        border-radius: 20px;
                        text-align: center;
                        max-width: 440px;
                        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
                    }
                    .icon {
                        background: rgba(37, 99, 235, 0.15);
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                        border: 1px solid rgba(37, 99, 235, 0.3);
                        font-size: 32px;
                    }
                    h1 {
                        color: #3b82f6;
                        margin-top: 0;
                        font-weight: 800;
                        font-size: 28px;
                        letter-spacing: -0.5px;
                    }
                    p {
                        color: #94a3b8;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 25px;
                    }
                    .btn {
                        display: inline-block;
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        color: white;
                        text-decoration: none;
                        padding: 12px 28px;
                        border-radius: 10px;
                        font-weight: 600;
                        font-size: 15px;
                        transition: all 0.2s ease-in-out;
                        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -2px rgba(37, 99, 235, 0.2);
                    }
                    .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
                        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">🚀</div>
                    <h1>Hello BE!</h1>
                    <p>School Information System Backend is running successfully on cloud environment.</p>
                    <a class="btn" href="/docs">Open Swagger API Docs</a>
                </div>
            </body>
        </html>
        """

    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()