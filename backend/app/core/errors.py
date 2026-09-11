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


def get_req_id(request: Request) -> str:
    """Helper to safely extract request ID from request state."""
    return getattr(request.state, "request_id", "unknown")


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on FastAPI application instance."""

    @app.exception_handler(PoshanCareException)
    async def custom_exception_handler(
        request: Request, exc: PoshanCareException
    ) -> JSONResponse:
        req_id = get_req_id(request)
        logger.warning(
            f"Custom exception [{exc.code}] req_id={req_id} path={request.url.path}: {exc.message}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            headers={"X-Request-ID": req_id},
            content={
                "status": "error",
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        req_id = get_req_id(request)
        logger.warning(
            f"HTTP exception [{exc.status_code}] req_id={req_id} path={request.url.path}: {exc.detail}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            headers={"X-Request-ID": req_id},
            content={
                "status": "error",
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": str(exc.detail),
                    "details": None,
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        req_id = get_req_id(request)
        logger.warning(
            f"Validation error req_id={req_id} path={request.url.path}: {exc.errors()}"
        )
        clean_errors = []
        for err in exc.errors():
            clean_errors.append({
                "type": str(err.get("type")),
                "loc": [str(l) for l in err.get("loc", [])],
                "msg": str(err.get("msg")),
            })

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            headers={"X-Request-ID": req_id},
            content={
                "status": "error",
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request payload or query parameters.",
                    "details": clean_errors,
                    "request_id": req_id,
                },
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        req_id = get_req_id(request)
        logger.error(
            f"Unhandled exception req_id={req_id} path={request.url.path}: {str(exc)}",
            exc_info=True,
        )
        message = (
            str(exc)
            if settings.DEBUG
            else "An unexpected server error occurred."
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            headers={"X-Request-ID": req_id},
            content={
                "status": "error",
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": message,
                    "details": None,
                    "request_id": req_id,
                },
            },
        )
