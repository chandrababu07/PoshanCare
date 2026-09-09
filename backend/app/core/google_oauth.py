from typing import Any, Dict, Optional
from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.core.errors import PoshanCareException
from app.core.logging import logger


def verify_google_id_token(token: str) -> Dict[str, Any]:
    """Verify Google OAuth 2.0 ID Token and return decoded token payload claims.
    
    Raises PoshanCareException if token validation fails.
    """
    if not token or not token.strip():
        raise PoshanCareException(
            message="Google ID Token is required.",
            code="INVALID_GOOGLE_TOKEN",
            status_code=400,
        )

    try:
        request = requests.Request()
        # Verify token against Google public certificates
        # If GOOGLE_CLIENT_ID is configured, enforce audience check
        client_id = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        
        payload = id_token.verify_oauth2_token(
            token.strip(), request, audience=client_id
        )

        # Validate issuer
        if payload.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            raise PoshanCareException(
                message="Invalid Google ID Token issuer.",
                code="INVALID_GOOGLE_TOKEN",
                status_code=400,
            )

        # Ensure email is present and verified by Google
        email = payload.get("email")
        if not email:
            raise PoshanCareException(
                message="Google account must have an associated email address.",
                code="INVALID_GOOGLE_TOKEN",
                status_code=400,
            )

        return payload

    except ValueError as err:
        logger.warning(f"Google ID Token verification failed: {err}")
        raise PoshanCareException(
            message="Invalid or expired Google authentication token.",
            code="INVALID_GOOGLE_TOKEN",
            status_code=401,
        )
    except Exception as err:
        logger.error(f"Unexpected error during Google token verification: {err}")
        raise PoshanCareException(
            message="Google authentication service error.",
            code="GOOGLE_AUTH_ERROR",
            status_code=500,
        )
