# Backend

This backend service is built with FastAPI and follows a modular architecture designed for enterprise usage.

## Folder Responsibilities

- `app/api/` - REST API routers and versioned endpoints
- `app/models/` - SQLAlchemy ORM models for school, student, course, enrollment, syllabus, and video entities
- `app/schemas/` - Pydantic request/response schemas
- `app/services/` - Business service layer and domain orchestration
- `app/auth/` - JWT authentication, password hashing, RBAC dependencies
- `app/database/` - Database engine and session configuration
- `app/core/` - Application settings and global configuration
- `app/utils/` - Shared utilities and helper modules
- `alembic/` - Database migration scripts and configuration
- `tests/` - Unit and integration tests

## Setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
