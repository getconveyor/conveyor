import { toast } from "sonner";

export type ErrorDetails = Record<string, unknown> | string | null;

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Network error occurred", details?: ErrorDetails) {
    super(message, "NETWORK_ERROR", 0, details);
    this.name = "NetworkError";
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication failed", details?: ErrorDetails) {
    super(message, "AUTH_ERROR", 401, details);
    this.name = "AuthError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: ErrorDetails) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: ErrorDetails) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
  }
}

export class PermissionError extends AppError {
  constructor(message: string = "Permission denied", details?: ErrorDetails) {
    super(message, "PERMISSION_DENIED", 403, details);
    this.name = "PermissionError";
  }
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Map common error messages to user-friendly versions
    if (error.message.includes("fetch")) {
      return "Unable to connect to server. Please check your internet connection.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Show error toast with appropriate styling
 */
export function showErrorToast(error: unknown, title?: string) {
  const message = getUserMessage(error);

  toast.error(title || "Error", {
    description: message,
    duration: 5000,
  });
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, title?: string) {
  toast.success(title || "Success", {
    description: message,
    duration: 3000,
  });
}

interface ApiErrorResponse {
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

/**
 * Handle API errors and return appropriate AppError
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: ApiErrorResponse;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  const message = errorData.message || errorData.detail || "An error occurred";

  switch (response.status) {
    case 400:
      throw new ValidationError(message, errorData);
    case 401:
      throw new AuthError(message, errorData);
    case 403:
      throw new PermissionError(message, errorData);
    case 404:
      throw new NotFoundError(message, errorData);
    case 500:
    case 502:
    case 503:
    case 504:
      throw new AppError("Server error. Please try again later.", "SERVER_ERROR", response.status, errorData);
    default:
      throw new AppError(message, "API_ERROR", response.status, errorData);
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        onRetry?.(attempt, error);

        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Log error to monitoring service (placeholder for Sentry, etc.)
 */
export function logError(error: unknown, context?: Record<string, any>) {
  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", error, context);
  }

  // TODO: Send to error tracking service
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Safe async handler that catches errors and shows toast
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    showToast?: boolean;
    toastTitle?: string;
    onError?: (error: unknown) => void;
    rethrow?: boolean;
  } = {}
): T {
  const { showToast = true, toastTitle, onError, rethrow = false } = options;

  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args });

      if (showToast) {
        showErrorToast(error, toastTitle);
      }

      onError?.(error);

      if (rethrow) {
        throw error;
      }
    }
  }) as T;
}
