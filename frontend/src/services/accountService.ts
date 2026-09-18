const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface RecordCounts {
  meals: number;
  custom_foods: number;
  favorite_foods: number;
  weight_logs: number;
  hydration_logs: number;
  activity_logs: number;
  health_goals: number;
  meal_plans: number;
  recipes: number;
  clinical_reports: number;
}

export interface AccountSummaryResponse {
  email: string;
  full_name: string;
  created_at: string;
  auth_provider: string;
  profile_type?: string;
  record_counts: RecordCounts;
  last_activity_at?: string | null;
}

export interface AccountDeleteResponse {
  status: string;
  message: string;
}

/**
 * Fetch authenticated account summary & record counts
 */
export async function getAccountSummary(): Promise<AccountSummaryResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/account/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AccountSummaryResponse;
  } catch (error) {
    console.warn('Account summary API warning:', error);
    return null;
  }
}

/**
 * Trigger structured health data JSON export download
 */
export async function exportAccountData(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/account/export`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error?.message || 'Data export failed.');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `poshancare-health-data-${new Date().toISOString().split('T')[0]}.json`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.warn('Export health data error:', error);
    throw error;
  }
}

/**
 * Request permanent account deletion
 */
export async function deleteAccount(): Promise<AccountDeleteResponse> {
  const response = await fetch(`${API_BASE_URL}/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || 'Account deletion failed.';
    throw new Error(errorMsg);
  }

  return data as AccountDeleteResponse;
}
