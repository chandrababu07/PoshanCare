import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings
from app.core.logging import logger


class EmailService:
    """Production email delivery service abstraction."""

    def __init__(self) -> None:
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.smtp_tls = settings.SMTP_TLS

    def is_configured(self) -> bool:
        """Check whether production SMTP credentials are configured."""
        return bool(self.smtp_host)

    def send_password_reset_email(
        self,
        to_email: str,
        reset_url: str,
        recipient_name: Optional[str] = None,
    ) -> bool:
        """Send password reset instructions with the reset link.

        In production with SMTP configured, transmits an email via TLS.
        In local development/testing without SMTP, safely handles dispatch without leaking secrets.
        """
        name = recipient_name or "PoshanCare User"
        subject = "PoshanCare — Password Reset Request"

        text_content = (
            f"Hello {name},\n\n"
            "We received a request to reset your PoshanCare account password.\n"
            f"Please use the following secure link to reset your password:\n\n"
            f"{reset_url}\n\n"
            f"This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.\n"
            "If you did not request this password reset, please ignore this email or contact support.\n\n"
            "— PoshanCare Security Team"
        )

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #059669; margin: 0;">PoshanCare</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Clinical Nutrition & Metabolic Intelligence</p>
    </div>
    <p>Hello {name},</p>
    <p>We received a request to reset your PoshanCare account password. Click the button below to set a new password:</p>
    <div style="margin: 32px 0;">
        <a href="{reset_url}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This secure link expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes and is single-use.</p>
    <p style="color: #64748b; font-size: 13px;">If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
    <p style="color: #94a3b8; font-size: 12px;">© PoshanCare Health Platform. Strictly confidential clinical communication.</p>
</body>
</html>"""

        if not self.is_configured():
            logger.info(f"Email service [dev/test]: Password reset notification triggered for recipient {to_email}")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            msg.attach(MIMEText(text_content, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)
            if self.smtp_tls:
                server.starttls()
            if self.smtp_user and self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)
            server.sendmail(self.from_email, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Password reset email successfully dispatched to {to_email}")
            return True
        except Exception as err:
            logger.error(f"Failed to transmit password reset email to {to_email}: {err}")
            return False


email_service = EmailService()
