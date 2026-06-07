# Architecture Overview

## Project Layout

- `backend/`
  - `app/` - FastAPI application modules
  - `alembic/` - migration configuration and scripts
  - `tests/` - automated backend tests
  - `requirements.txt` - Python dependencies
  - `.env.example` - environment variables template

- `frontend/`
  - `src/` - React app source code
  - `public/` - static public assets
  - `package.json` - npm dependencies and scripts
  - `vite.config.js` - Vite configuration

- `docs/` - architecture, design decisions, and integration guides

## Backend Responsibilities

- `api/` contains route definitions and endpoint composition.
- `models/` defines the domain entities and ORM mapping.
- `schemas/` separates request validation and response serialization.
- `services/` implements business workflows and domain operations.
- `auth/` manages JWT creation, validation, and RBAC enforcement.
- `database/` configures the SQLAlchemy engine and session scope.
- `core/` holds centralized environment and application settings.
- `utils/` stores reusable helper functions.

## Frontend Responsibilities

- `api/` centralizes HTTP client configuration.
- `components/` stores reusable UI components.
- `pages/` contains route-specific views.
- `layouts/` defines page scaffolding and wrappers.
- `routes/` exports route definitions and route helpers.
- `store/` configures global application state.
- `hooks/` implements reusable React hooks.
- `utils/` stores shared client-side utilities.
- `theme/` provides Material UI theme and app styling.
