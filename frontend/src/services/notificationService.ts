const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export type NotificationSeverity = 'info' | 'low' | 'medium' | 'high';
export type NotificationType =
  | 'hydration'
  | 'nutrition'
  | 'activity'
  | 'goal'
  | 'meal_plan'
  | 'consistency'
  | 'weight'
  | 'weekly_summary'
  | 'system'
  | string;

export interface HealthNotification {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  action?: string | null;
  source: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  metadata_json?: Record<string, unknown> | null;
}

export interface NotificationListResponse {
  items: HealthNotification[];
  total_count: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationGenerateResponse {
  generated_count: number;
  notifications: HealthNotification[];
  message: string;
}

export interface NotificationPreferenceResponse {
  user_id: number;
  meal_reminders_enabled: boolean;
  meal_reminder_time: string;
  hydration_reminders_enabled: boolean;
  hydration_reminder_frequency_hours: number;
  activity_reminders_enabled: boolean;
  weight_reminders_enabled: boolean;
  goal_updates_enabled: boolean;
  weekly_summary_enabled: boolean;
  insights_enabled: boolean;
  updated_at: string;
}

export const notificationService = {
  /**
   * Retrieves notifications for the logged in user with optional filters.
   */
  getNotifications: async (
    unreadOnly: boolean = false,
    notificationType?: string,
    limit: number = 50
  ): Promise<NotificationListResponse | null> => {
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unread_only', 'true');
      if (notificationType && notificationType !== 'all') {
        params.append('notification_type', notificationType.toLowerCase());
      }
      params.append('limit', limit.toString());

      const res = await fetch(`${API_BASE_URL}/notifications?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        return (await res.json()) as NotificationListResponse;
      }
      return null;
    } catch (e: unknown) {
      console.warn('Error fetching notifications:', e);
      return null;
    }
  },

  /**
   * Retrieves current unread notification count.
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const body = (await res.json()) as UnreadCountResponse;
        return body.count || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  /**
   * Marks a single notification as read.
   */
  markNotificationRead: async (notificationId: number): Promise<HealthNotification | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        return (await res.json()) as HealthNotification;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Marks all unread notifications as read.
   */
  markAllNotificationsRead: async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const body = await res.json();
        return body.count || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  /**
   * Evaluates telemetry and generates new notifications.
   */
  generateNotifications: async (): Promise<NotificationGenerateResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        return (await res.json()) as NotificationGenerateResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches notification preferences for current user.
   */
  getPreferences: async (): Promise<NotificationPreferenceResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        return (await res.json()) as NotificationPreferenceResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Updates notification preferences for current user.
   */
  updatePreferences: async (
    patch: Partial<NotificationPreferenceResponse>
  ): Promise<NotificationPreferenceResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });

      if (res.ok) {
        return (await res.json()) as NotificationPreferenceResponse;
      }
      return null;
    } catch {
      return null;
    }
  },
};

export default notificationService;
