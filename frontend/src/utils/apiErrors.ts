/**
 * PoshanCare API Error & Offline Classification Utility
 * 
 * Accurately classifies network and HTTP errors to provide clear, actionable,
 * and secure messages without leaking backend implementation internals.
 */

export interface ClassifiedApiError {
  kind:
    | 'offline'
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'validation'
    | 'rate_limited'
    | 'server_error'
    | 'unknown';
  message: string;
  statusCode?: number;
}

/**
 * Check if an error or current device state represents offline / network unavailability.
 */
export function isNetworkOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network request failed') ||
      msg.includes('load failed')
    );
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      error.name === 'AbortError' ||
      msg.includes('network') ||
      msg.includes('offline') ||
      msg.includes('failed to fetch')
    );
  }

  return false;
}

/**
 * Classify API errors and return a user-friendly, secure description.
 * Ensures network failures explicitly alert that changes were not saved.
 */
export function parseApiError(
  error: unknown,
  statusCode?: number,
  defaultFallback: string = 'An unexpected error occurred. Please try again.'
): ClassifiedApiError {
  // 1. Offline / Network connection failure
  if (isNetworkOfflineError(error)) {
    return {
      kind: 'offline',
      message: "You're offline. Your changes haven't been saved.",
      statusCode: 0,
    };
  }

  // 2. HTTP Status Code Classification
  if (statusCode) {
    switch (statusCode) {
      case 401:
        return {
          kind: 'unauthorized',
          message: 'Your session has expired. Please sign in again.',
          statusCode: 401,
        };
      case 403:
        return {
          kind: 'forbidden',
          message: 'You do not have permission to perform this action.',
          statusCode: 403,
        };
      case 404:
        return {
          kind: 'not_found',
          message: 'The requested resource was not found.',
          statusCode: 404,
        };
      case 422:
        return {
          kind: 'validation',
          message:
            error instanceof Error && error.message && !error.message.startsWith('HTTP')
              ? error.message
              : 'Invalid input provided. Please check your entries.',
          statusCode: 422,
        };
      case 429:
        return {
          kind: 'rate_limited',
          message: 'Too many requests. Please wait a moment before trying again.',
          statusCode: 429,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          kind: 'server_error',
          message: 'Server is temporarily unavailable. Please try again shortly.',
          statusCode,
        };
      default:
        break;
    }
  }

  // 3. Error object inspection
  if (error instanceof Error && error.message) {
    const msg = error.message;
    // Don't expose internal stack trace / SQL / backend internals
    if (
      msg.toLowerCase().includes('database') ||
      msg.toLowerCase().includes('sql') ||
      msg.toLowerCase().includes('traceback') ||
      msg.toLowerCase().includes('column') ||
      msg.toLowerCase().includes('syntax')
    ) {
      return {
        kind: 'server_error',
        message: 'A system error occurred. Our team has been alerted.',
        statusCode: 500,
      };
    }
    return {
      kind: 'unknown',
      message: msg,
      statusCode,
    };
  }

  return {
    kind: 'unknown',
    message: defaultFallback,
    statusCode,
  };
}
