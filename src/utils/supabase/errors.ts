/**
 * Auth error detection and handling utilities
 * Provides centralized session expiry and auth error handling
 */

/**
 * Check if an error is authentication-related
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const msg = String(error.message || '').toLowerCase();
  const status = error.status || error.code;

  return (
    status === 401 ||
    status === 403 ||
    msg.includes('jwt expired') ||
    msg.includes('invalid jwt') ||
    msg.includes('not authenticated') ||
    msg.includes('invalid authentication') ||
    msg.includes('refresh_token_not_found') ||
    msg.includes('invalid refresh token') ||
    msg.includes('user not found')
  );
}

/**
 * Custom error class for session expiry
 */
export class SessionExpiredError extends Error {
  constructor(message = 'Your session has expired. Please log in again.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

/**
 * Global session expiry handler
 */
type SessionHandler = () => void;

let onSessionExpired: SessionHandler | null = null;

/**
 * Register a global handler for session expiry
 * Should be called once in App.tsx on mount
 */
export function setOnSessionExpired(handler: SessionHandler) {
  onSessionExpired = handler;
}

/**
 * Handle a potential session error
 * Returns true if it was a session error and was handled
 */
export function handlePossibleSessionError(error: any): boolean {
  if (error instanceof SessionExpiredError || isAuthError(error)) {
    console.warn('🔴 Session expired or auth error detected:', error.message);
    
    if (onSessionExpired) {
      onSessionExpired();
    }
    
    return true;
  }
  
  return false;
}

/**
 * Wrap Supabase errors and convert auth errors to SessionExpiredError
 */
export function wrapSupabaseError(error: any): Error {
  if (isAuthError(error)) {
    return new SessionExpiredError();
  }
  
  return error;
}
