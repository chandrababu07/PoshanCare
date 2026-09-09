from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Pydantic schema for general application health check endpoint."""

    status: str = Field(..., json_schema_extra={"example": "healthy"})
    environment: str = Field(..., json_schema_extra={"example": "development"})
    version: str = Field(..., json_schema_extra={"example": "0.1.0"})
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DatabaseHealthResponse(BaseModel):
    """Pydantic schema for database connectivity and readiness endpoint."""

    status: str = Field(..., json_schema_extra={"example": "healthy"})
    database: str = Field(..., json_schema_extra={"example": "connected"})
    dialect: str = Field(..., json_schema_extra={"example": "sqlite"})
    record_count: int = Field(..., json_schema_extra={"example": 1})
    timestamp: datetime = Field(default_factory=datetime.utcnow)

