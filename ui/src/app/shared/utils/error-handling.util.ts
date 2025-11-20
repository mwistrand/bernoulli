import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../types/problem-details.type';

/**
 * Extract a user-friendly error message from an HTTP error response.
 * Handles RFC 7807 Problem Details format.
 */
export function extractErrorMessage(error: HttpErrorResponse): string {
  // Client-side or network error
  if (error.error instanceof ErrorEvent) {
    return error.error.message || 'A network error occurred';
  }

  // Server returned an error response
  if (error.error) {
    // Check if it's RFC 7807 Problem Details format
    if (isProblemDetails(error.error)) {
      const problemDetails = error.error as ProblemDetails;

      // If there are validation errors, join them
      if (problemDetails.errors && problemDetails.errors.length > 0) {
        return problemDetails.errors.join(', ');
      }

      // Return the detail message
      return problemDetails.detail;
    }

    // Legacy format support (for backward compatibility)
    if (error.error.message) {
      if (Array.isArray(error.error.message)) {
        return error.error.message.join(', ');
      }
      return error.error.message;
    }
  }

  // Connection error
  if (error.status === 0) {
    return 'Unable to connect to the server';
  }

  // Generic fallback
  return 'An unexpected error occurred';
}

/**
 * Type guard to check if an error response is RFC 7807 Problem Details
 */
function isProblemDetails(error: unknown): error is ProblemDetails {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const obj = error as Record<string, unknown>;

  return (
    typeof obj['type'] === 'string' &&
    typeof obj['title'] === 'string' &&
    typeof obj['status'] === 'number' &&
    typeof obj['detail'] === 'string' &&
    typeof obj['instance'] === 'string'
  );
}

/**
 * Extract validation errors from a Problem Details response
 */
export function extractValidationErrors(error: HttpErrorResponse): string[] {
  if (error.error && isProblemDetails(error.error)) {
    const problemDetails = error.error as ProblemDetails;
    return problemDetails.errors || [];
  }
  return [];
}

/**
 * Get the correlation ID from an error response for support tickets
 */
export function extractCorrelationId(error: HttpErrorResponse): string | undefined {
  if (error.error && isProblemDetails(error.error)) {
    const problemDetails = error.error as ProblemDetails;
    return problemDetails.correlationId;
  }
  return undefined;
}
