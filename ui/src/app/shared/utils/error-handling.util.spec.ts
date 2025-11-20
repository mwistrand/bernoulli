import { HttpErrorResponse } from '@angular/common/http';
import {
  extractErrorMessage,
  extractValidationErrors,
  extractCorrelationId,
} from './error-handling.util';
import { ProblemDetails } from '../types/problem-details.type';

describe('Error Handling Utilities', () => {
  describe('extractErrorMessage', () => {
    it('should extract detail from RFC 7807 Problem Details', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/404',
        title: 'Not Found',
        status: 404,
        detail: 'Resource not found',
        instance: '/api/users/123',
        timestamp: new Date().toISOString(),
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 404,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('Resource not found');
    });

    it('should join validation errors from RFC 7807 Problem Details', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Validation failed',
        instance: '/api/users',
        timestamp: new Date().toISOString(),
        errors: ['field1 is required', 'field2 is invalid'],
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 400,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('field1 is required, field2 is invalid');
    });

    it('should extract detail when no validation errors present', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An internal server error occurred.',
        instance: '/api/projects',
        timestamp: new Date().toISOString(),
        errors: [],
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 500,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('An internal server error occurred.');
    });

    it('should handle legacy format with message string', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Legacy error message' },
        status: 400,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('Legacy error message');
    });

    it('should handle legacy format with message array', () => {
      const error = new HttpErrorResponse({
        error: { message: ['error1', 'error2', 'error3'] },
        status: 400,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('error1, error2, error3');
    });

    it('should return network error message for ErrorEvent', () => {
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Connection refused',
      });

      const error = new HttpErrorResponse({
        error: errorEvent,
        status: 0,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('Connection refused');
    });

    it('should return default network error message when ErrorEvent has no message', () => {
      const errorEvent = new ErrorEvent('Network error');

      const error = new HttpErrorResponse({
        error: errorEvent,
        status: 0,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('A network error occurred');
    });

    it('should return server connection error for status 0', () => {
      const error = new HttpErrorResponse({
        error: null,
        status: 0,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('Unable to connect to the server');
    });

    it('should return generic error message when no error details available', () => {
      const error = new HttpErrorResponse({
        error: null,
        status: 500,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('An unexpected error occurred');
    });

    it('should return generic error message for unknown error format', () => {
      const error = new HttpErrorResponse({
        error: { foo: 'bar' },
        status: 500,
      });

      const message = extractErrorMessage(error);

      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('extractValidationErrors', () => {
    it('should extract validation errors from RFC 7807 Problem Details', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Validation failed',
        instance: '/api/users',
        timestamp: new Date().toISOString(),
        errors: ['field1 is required', 'field2 is invalid'],
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 400,
      });

      const errors = extractValidationErrors(error);

      expect(errors).toEqual(['field1 is required', 'field2 is invalid']);
    });

    it('should return empty array when no validation errors present', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/404',
        title: 'Not Found',
        status: 404,
        detail: 'Resource not found',
        instance: '/api/users/123',
        timestamp: new Date().toISOString(),
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 404,
      });

      const errors = extractValidationErrors(error);

      expect(errors).toEqual([]);
    });

    it('should return empty array for non-RFC 7807 errors', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Legacy error' },
        status: 400,
      });

      const errors = extractValidationErrors(error);

      expect(errors).toEqual([]);
    });
  });

  describe('extractCorrelationId', () => {
    it('should extract correlation ID from RFC 7807 Problem Details', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/500',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An error occurred',
        instance: '/api/projects',
        timestamp: new Date().toISOString(),
        correlationId: 'test-correlation-123',
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 500,
      });

      const correlationId = extractCorrelationId(error);

      expect(correlationId).toBe('test-correlation-123');
    });

    it('should return undefined when no correlation ID present', () => {
      const problemDetails: ProblemDetails = {
        type: 'https://httpstatuses.io/404',
        title: 'Not Found',
        status: 404,
        detail: 'Resource not found',
        instance: '/api/users/123',
        timestamp: new Date().toISOString(),
      };

      const error = new HttpErrorResponse({
        error: problemDetails,
        status: 404,
      });

      const correlationId = extractCorrelationId(error);

      expect(correlationId).toBeUndefined();
    });

    it('should return undefined for non-RFC 7807 errors', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Legacy error' },
        status: 400,
      });

      const correlationId = extractCorrelationId(error);

      expect(correlationId).toBeUndefined();
    });
  });
});
