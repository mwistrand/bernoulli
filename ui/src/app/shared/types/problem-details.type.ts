/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  /**
   * A URI reference that identifies the problem type.
   */
  type: string;

  /**
   * A short, human-readable summary of the problem type.
   */
  title: string;

  /**
   * The HTTP status code for this occurrence of the problem.
   */
  status: number;

  /**
   * A human-readable explanation specific to this occurrence of the problem.
   */
  detail: string;

  /**
   * A URI reference that identifies the specific occurrence of the problem.
   */
  instance: string;

  /**
   * ISO timestamp when the error occurred
   */
  timestamp: string;

  /**
   * Correlation ID for request tracing
   */
  correlationId?: string;

  /**
   * Additional error context (development only)
   */
  errors?: string[];
}
