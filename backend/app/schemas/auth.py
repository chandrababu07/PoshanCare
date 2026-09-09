from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    """Payload for registering a new PoshanCare user account."""

    email: EmailStr = Field(..., json_schema_extra={"example": "user@example.com"})
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        json_schema_extra={"example": "SecurePass123!"},
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        json_schema_extra={"example": "Rahul Sharma"},
    )

    @field_validator("full_name", "email", mode="before")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() or not c.isalnum() for c in value):
            raise ValueError("Password must contain at least one number or special character.")
        return value


class UserLogin(BaseModel):
    """Payload for authenticating an existing PoshanCare user."""

    email: EmailStr = Field(..., json_schema_extra={"example": "user@example.com"})
    password: str = Field(..., json_schema_extra={"example": "SecurePass123!"})

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip().lower()
        return value


class UserResponse(BaseModel):
    """Sanitized user profile model returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime



class AuthResponse(BaseModel):
    """Authentication success response (tokens delivered via HttpOnly cookies)."""

    status: str = Field(default="success")
    message: str = Field(..., json_schema_extra={"example": "Authentication successful."})
    user: UserResponse
