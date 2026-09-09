# PoshanCare Backend API

Production-oriented backend foundation for **PoshanCare** built with **FastAPI**, **Python 3.13**, **SQLAlchemy 2.0**, **Alembic**, and **Pydantic v2**.

---

## 🛠️ Architecture Stack

- **Framework**: FastAPI (ASGI with Uvicorn)
- **Database**: PostgreSQL (Production) / SQLite `aiosqlite` (Zero-dependency local dev/testing fallback)
- **ORM**: SQLAlchemy 2.0 (`AsyncSession` & `Mapped` type hints)
- **Database Migrations**: Alembic
- **Validation**: Pydantic v2 (`BaseModel` & `pydantic-settings`)
- **Testing**: Pytest & `pytest-asyncio`

---

## 🚀 Quick Start Guide

### 1. Virtual Environment Setup
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default settings use local SQLite database (`sqlite+aiosqlite:///./poshancare.db`).

---

## 💾 Database Migrations (Alembic)

```bash
# Generate a new migration script
alembic revision --autogenerate -m "Initial health table"

# Apply migrations to database
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

---

## 🧪 Running Backend Tests

```bash
# Run pytest async test suite
pytest
```

---

## 💻 Running Development Server

```bash
# Start Uvicorn development server on http://localhost:8000
python -m uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI documentation is available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 API Endpoints

- `GET /` — Root metadata
- `GET /api/v1/health` — Application health check
- `GET /api/v1/health/db` — Database connectivity & readiness check

---

## 🔗 Frontend-Backend Communication

The Vite React frontend communicates with the backend via REST API calls targeting `http://localhost:8000/api/v1`.

- Environment variable in `frontend/.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:8000/api/v1
  ```
- Lightweight API fetch client is located at `frontend/src/services/api.ts`.
