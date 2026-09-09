import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    """Configure structured logging for PoshanCare API."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    log_format = (
        "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s"
    )

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Silence overly verbose third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )

    logger = logging.getLogger("poshancare")
    logger.info(
        f"Logging initialized for {settings.PROJECT_NAME} (env={settings.ENVIRONMENT})"
    )
    return logger


logger = setup_logging()
