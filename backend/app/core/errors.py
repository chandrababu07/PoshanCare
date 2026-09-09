from typing import Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger


class PoshanCareException(Exception):
    """Base custom exception for PoshanCare backend."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Any = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on FastAPI application instance."""

    @app.exception_handler(PoshanCareException)
    async def custom_exception_handler(
        request: Request, exc: PoshanCareException
    ) -> JSONResponse:
        logger.warning(
            f"Custom exception [{exc.code}] path={request.url.path}: {exc.message}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        logger.warning(
            f"HTTP exception [{exc.status_code}] path={request.url.path}: {exc.detail}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": str(exc.detail),
                    "details": None,
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(
            f"Validation error path={request.url.path}: {exc.errors()}"
        )
        clean_errors = []
        for err in exc.errors():
            clean_errors.append({
                "type": str(err.get("type")),
                "loc": [str(l) for l in err.get("loc", [])],
                "msg": str(err.get("msg")),
            })

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request payload or query parameters.",
                    "details": clean_errors,
                },
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            f"Unhandled exception path={request.url.path}: {str(exc)}",
            exc_info=True,
        )
        message = (
            str(exc)
            if settings.DEBUG
            else "An unexpected server error occurred."
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": message,
                    "details": None,
                },
            },
        )
