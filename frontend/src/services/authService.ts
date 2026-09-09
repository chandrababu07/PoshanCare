import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Register a new user account with backend
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || 'Registration failed.';
    throw new Error(errorMsg);
  }

  return data as AuthResponse;
}

/**
 * Login user with credentials
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || 'Invalid email or password credentials.';
    throw new Error(errorMsg);
  }

  return data as AuthResponse;
}

/**
 * Fetch authenticated current user profile
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as User;
  } catch (error) {
    console.warn('Backend connection offline or unauthenticated.', error);
    return null;
  }
}

/**
 * Refresh access token session via HttpOnly refresh cookie
 */
export async function refreshAuthSession(): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthResponse;
  } catch {
    return null;
  }
}

/**
 * Authenticate with backend using Google OAuth ID Token
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id_token: idToken }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || 'Google authentication failed.';
    throw new Error(errorMsg);
  }

  return data as AuthResponse;
}

/**
 * Log out user & invalidate server refresh session
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Logout API warning:', error);
  }
}
