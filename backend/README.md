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

## 📡 API Health & Readiness Probes

- `GET /` — Root service metadata
- `GET /api/v1/health` — **Liveness Probe**: Process status, environment, version, and server timestamp.
- `GET /api/v1/ready` / `GET /api/v1/health/db` — **Readiness Probe**: Database connectivity, query latency, and record count checks. Returns `HTTP 200 OK` on health, or sanitized `HTTP 503 Service Unavailable` on database failure.

---

## 🔒 Security Architecture & Hardening

1. **HttpOnly Cookie Authentication**:
   - `access_token` and `refresh_token` stored in HttpOnly, SameSite=Lax (or Strict), Secure cookies.
   - Prevents XSS token theft and client script tampering.
2. **Strict Dynamic Authorization (IDOR Protection)**:
   - Resource access queries filter dynamically using `current_user.id`.
   - Access attempts to records owned by other users return `HTTP 403 Forbidden` or `HTTP 404 Not Found`.
3. **Sliding-Window Rate Limiting**:
   - High-rate and authentication endpoints (`/auth/login`, `/auth/register`, `/auth/google`, `/notifications/generate`, `/account/export`, `DELETE /account`) enforce IP-based rate limiting to mitigate brute-force and credential stuffing attacks.
4. **Request Correlation (`X-Request-ID`) & Error Sanitization**:
   - Middleware attaches UUID `X-Request-ID` to all incoming requests and outgoing responses.
   - Structured error handlers return sanitized JSON without exposing internal stack traces or database schema details in production.
5. **Security Headers**:
   - Applies CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.

---

## 🧪 Security Regression Matrix

Run automated security tests:
```bash
pytest tests/test_security_regression.py
```
Validates 18 security controls across unauthenticated access rejection, cross-user isolation, IDOR prevention, token validation, and account deletion session revocation.

---

## 🔗 Frontend-Backend Communication

The Vite React frontend communicates with the backend via REST API calls targeting `http://localhost:8000/api/v1`.

- Environment variable in `frontend/.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:8000/api/v1
  ```
- Lightweight API fetch client is located at `frontend/src/services/api.ts`.
