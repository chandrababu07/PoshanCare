/**
 * PoshanCare API Communication Service
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface HealthResponse {
  status: string;
  environment: string;
  version: string;
  timestamp: string;
}

export interface DatabaseHealthResponse {
  status: string;
  database: string;
  dialect: string;
  record_count: number;
  timestamp: string;
}

/**
 * Fetch application health from backend API
 */
export async function fetchHealthStatus(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check returned HTTP ${response.status}`);
    }

    return (await response.json()) as HealthResponse;
  } catch (error) {
    console.warn('Backend API offline or unreachable. Using frontend fallback.', error);
    return null;
  }
}

/**
 * Fetch database connectivity health from backend API
 */
export async function fetchDatabaseHealthStatus(): Promise<DatabaseHealthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/db`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Database health check returned HTTP ${response.status}`);
    }

    return (await response.json()) as DatabaseHealthResponse;
  } catch (error) {
    console.warn('Backend DB API offline or unreachable. Using frontend fallback.', error);
    return null;
  }
}
