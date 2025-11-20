/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 *
 * A standard format for machine-readable details of errors in HTTP API responses.
 */

/**
 * Core RFC 7807 Problem Details structure
 */
export interface ProblemDetails {
	/**
	 * A URI reference that identifies the problem type.
	 * When dereferenced, it SHOULD provide human-readable documentation.
	 * Defaults to "about:blank" when no specific type is available.
	 */
	type: string;

	/**
	 * A short, human-readable summary of the problem type.
	 * SHOULD NOT change from occurrence to occurrence of the problem.
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
	 * It may or may not yield further information if dereferenced.
	 */
	instance: string;

	/**
	 * Extension members - additional properties specific to the problem type
	 */
	[key: string]: unknown;
}

/**
 * Extended Problem Details with additional context fields
 */
export interface ExtendedProblemDetails extends ProblemDetails {
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
