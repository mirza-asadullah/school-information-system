# School Information System

A production-ready monorepo scaffold for a School Information System built with FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT authentication, RBAC, React, Vite, Material UI, Redux Toolkit, and Axios.

## Workspace Structure

- `backend/` - FastAPI backend application
- `frontend/` - React + Vite frontend application
- `docs/` - Architecture and design documentation

## Quick Start

### Backend

```bash
cd school-information-system/backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
```

### Frontend

```bash
cd school-information-system/frontend
npm install
npm run dev
```

## Architecture Overview

This scaffold separates API, domain models, services, auth, and database configuration for a scalable backend. The frontend is organized around pages, components, routes, state management, and theme configuration.
