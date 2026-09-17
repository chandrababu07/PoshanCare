# PoshanCare — Production Personalized Health & Nutrition Platform

PoshanCare is a production-grade, personalized nutrition and health platform engineered with strict authenticated user isolation, privacy protections, zero mock data, and robust observability.

---

## 🔒 Production Security Architecture

PoshanCare enforces modern defense-in-depth security standards across all layers:

1. **HttpOnly & Secure Cookie Authentication**
   - Authentication tokens (`access_token`, `refresh_token`) are delivered exclusively via `HttpOnly`, `SameSite=Lax` (or `Strict`), `Secure` cookies.
   - Prevents client-side JavaScript access to raw JWTs, mitigating Cross-Site Scripting (XSS) token exfiltration.

2. **Strict Authorization & User Isolation (IDOR Protection)**
   - All user data endpoints dynamically filter records using `current_user.id` extracted directly from the verified session payload.
   - Cross-user data access attempts return `HTTP 403 Forbidden` or `HTTP 404 Not Found`.

3. **Rate Limiting Protection**
   - High-risk operations (e.g. `/auth/login`, `/auth/register`, `/auth/google`, `/notifications/generate`, `/account/export`, `DELETE /account`) are protected with sliding-window rate limiters to prevent brute-force attacks and abuse.

4. **Request Correlation & Traceability (`X-Request-ID`)**
   - Every API request is assigned a unique UUID correlation header (`X-Request-ID`).
   - If an error occurs, the correlation ID is included in structured JSON error responses for rapid diagnostic investigation without exposing internal stack traces.

5. **Security Hardening Headers**
   - The application middleware applies standard security headers: `Content-Security-Policy`, `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.

---

## 🏥 Health Probes & Readiness Architecture

PoshanCare provides distinct endpoints for infrastructure orchestration and liveness monitoring:

- `GET /api/v1/health` — **Liveness Probe**
  - Confirms the API service process is active and responding.
  - Returns `HTTP 200 OK` with service environment, timestamp, and version metadata.
- `GET /api/v1/ready` / `GET /api/v1/health/db` — **Readiness Probe**
  - Verifies live database connectivity and pool responsiveness before routing user traffic.
  - Returns `HTTP 200 OK` when the database query succeeds; returns sanitized `HTTP 503 Service Unavailable` if database connectivity is impaired.

---

## 🧪 Security Regression Test Suite

The security regression matrix (`backend/tests/test_security_regression.py`) validates key safety controls:

- `test_1_unauthenticated_endpoint_rejection`: Unauthenticated request returns 401.
- `test_2_user_a_cannot_access_user_b_meal`: Meal diary data is strictly isolated per user.
- `test_3_user_a_cannot_modify_user_b_meal`: IDOR attempt on meal entry modification is rejected.
- `test_4_user_a_cannot_delete_user_b_meal`: IDOR attempt on meal deletion is rejected.
- `test_5_user_a_cannot_access_user_b_recipe`: Recipe entries are isolated per account.
- `test_6_user_a_cannot_access_user_b_meal_plan`: Meal plans are strictly non-accessible across users.
- `test_7_user_a_cannot_access_user_b_hydration`: Hydration logs enforce user scope.
- `test_8_user_a_cannot_access_user_b_activity`: Activity telemetry is isolated per account.
- `test_9_user_a_cannot_access_user_b_weight_log`: Weight metrics enforce user scope.
- `test_10_user_a_cannot_access_user_b_goal`: Health goals are strictly private.
- `test_11_user_a_cannot_access_user_b_notifications`: System notifications are isolated.
- `test_12_user_a_cannot_modify_user_b_notification_preferences`: Notification settings mutations do not cross users.
- `test_13_user_a_cannot_access_user_b_reports`: Audit reports contain only current user data.
- `test_14_user_a_cannot_access_user_b_health_insights`: Telemetry insights enforce current user scoping.
- `test_15_user_a_cannot_export_user_b_data`: Account data export contains only current user profile and records.
- `test_16_deleted_account_session_becomes_invalid`: Deleted account sessions immediately lose endpoint access.
- `test_17_invalid_authentication_cookie_rejected`: Garbage authentication cookies are rejected.
- `test_18_malformed_authentication_token_rejected`: Tampered or invalid JWT signatures are rejected.

---

## 🚀 Quick Execution Guide

### Backend Services & Tests
```bash
cd backend
pip install -r requirements.txt
pytest
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Services & Verification
```bash
cd frontend
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```
