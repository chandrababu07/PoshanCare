from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine
from app.models.health import HealthCheckRecord
from app.db.session import AsyncSessionLocal
from sqlalchemy import select


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    # HR-3: Fail fast if production configuration is invalid or weak
    if settings.ENVIRONMENT == "production":
        settings.validate_production_config()

    # HR-2: Base.metadata.create_all only executes in dev/testing; Alembic manages production schemas
    if settings.ENVIRONMENT in ("development", "test"):
        logger.info("Initializing PoshanCare database tables on startup (development/test mode)...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    else:
        logger.info("Production mode active: Skipping automatic schema creation. Alembic migrations are authoritative.")

    # Initialize system health record if health_check_records table is empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(HealthCheckRecord))
        records = result.scalars().all()
        if not records:
            initial_record = HealthCheckRecord(
                status="healthy",
                notes="Initial system health record initialized.",
            )
            session.add(initial_record)
            await session.commit()
            logger.info("System health monitoring infrastructure record initialized.")

    yield
    logger.info("Shutting down PoshanCare backend application...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PoshanCare Modern Clinical Nutrition Intelligence API",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Configure CORS Middleware
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


import uuid

# Configure Request Correlation ID Middleware
@app.middleware("http")
async def add_request_id_header(request, call_next):
    """Attach unique X-Request-ID to request state and response headers."""
    client_req_id = request.headers.get("x-request-id")
    if client_req_id and len(client_req_id) <= 64:
        request_id = client_req_id
    else:
        request_id = str(uuid.uuid4())

    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Configure Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Inject production security response headers on all outgoing HTTP responses."""
    response = await call_next(request)
    if settings.ENABLE_SECURITY_HEADERS:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http: https:;"
        )
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Register Centralized Error Handlers
register_exception_handlers(app)

# Include Versioned API Routers
app.include_router(api_v1_router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    """Root metadata endpoint."""
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "status": "online",
            "version": "0.1.0",
            "docs": "/docs" if settings.DEBUG else "disabled",
            "api_v1": "/api/v1/health",
        }
    )
