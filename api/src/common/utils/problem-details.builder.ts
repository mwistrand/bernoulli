import { HttpStatus } from '@nestjs/common';
import { ExtendedProblemDetails } from '../types/problem-details.type';

/**
 * Builder for creating RFC 7807 Problem Details responses
 */
export class ProblemDetailsBuilder {
	private static readonly PROBLEM_TYPE_BASE_URI = 'https://httpstatuses.io/';

	/**
	 * Map of HTTP status codes to standard problem titles
	 */
	private static readonly STATUS_TITLES: Record<number, string> = {
		[HttpStatus.BAD_REQUEST]: 'Bad Request',
		[HttpStatus.UNAUTHORIZED]: 'Unauthorized',
		[HttpStatus.PAYMENT_REQUIRED]: 'Payment Required',
		[HttpStatus.FORBIDDEN]: 'Forbidden',
		[HttpStatus.NOT_FOUND]: 'Not Found',
		[HttpStatus.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
		[HttpStatus.NOT_ACCEPTABLE]: 'Not Acceptable',
		[HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: 'Proxy Authentication Required',
		[HttpStatus.REQUEST_TIMEOUT]: 'Request Timeout',
		[HttpStatus.CONFLICT]: 'Conflict',
		[HttpStatus.GONE]: 'Gone',
		[HttpStatus.LENGTH_REQUIRED]: 'Length Required',
		[HttpStatus.PRECONDITION_FAILED]: 'Precondition Failed',
		[HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
		[HttpStatus.URI_TOO_LONG]: 'URI Too Long',
		[HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
		[HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: 'Range Not Satisfiable',
		[HttpStatus.EXPECTATION_FAILED]: 'Expectation Failed',
		[HttpStatus.I_AM_A_TEAPOT]: "I'm a teapot",
		[HttpStatus.MISDIRECTED]: 'Misdirected Request',
		[HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
		[HttpStatus.FAILED_DEPENDENCY]: 'Failed Dependency',
		[HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
		[HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
		[HttpStatus.NOT_IMPLEMENTED]: 'Not Implemented',
		[HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
		[HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
		[HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
		[HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP Version Not Supported',
	};

	/**
	 * Build a Problem Details response
	 */
	static build(options: {
		status: number;
		detail: string;
		instance: string;
		correlationId?: string;
		errors?: string[];
		title?: string;
		type?: string;
	}): ExtendedProblemDetails {
		const { status, detail, instance, correlationId, errors, title, type } = options;

		return {
			type: type || this.getTypeUri(status),
			title: title || this.getTitle(status),
			status,
			detail,
			instance,
			timestamp: new Date().toISOString(),
			correlationId,
			...(errors && errors.length > 0 ? { errors } : {}),
		};
	}

	/**
	 * Get the type URI for a status code
	 */
	private static getTypeUri(status: number): string {
		return `${this.PROBLEM_TYPE_BASE_URI}${status}`;
	}

	/**
	 * Get the standard title for a status code
	 */
	private static getTitle(status: number): string {
		return this.STATUS_TITLES[status] || 'Unknown Error';
	}

	/**
	 * Sanitize error detail for production (hide 5xx details)
	 */
	static sanitizeDetail(detail: string, status: number): string {
		if (process.env['NODE_ENV'] === 'production' && status >= 500) {
			return 'An internal server error occurred.';
		}
		return detail;
	}
}
