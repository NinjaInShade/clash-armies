export type FetchOptions = {
	data?: any;
	headers?: Record<string, string>;
};

export type APIErrors = Record<string, string[] | undefined> | string;

export class HTTPError extends Error {
	public name = 'HTTPError';
	public status: number;
	public errors?: APIErrors;

	constructor(message: string, status: number, errors?: APIErrors) {
		super(message);
		this.status = status;
		this.errors = errors;
		console.error(`HTTP Error: ${status} ${message}`, errors);
	}
}

export class HTTPApi {
	constructor() {}

	public post<T = unknown>(url: string, data: unknown) {
		return this.fetch<T>(url, 'POST', { data });
	}

	public delete<T = unknown>(url: string, data: unknown) {
		return this.fetch<T>(url, 'DELETE', { data });
	}

	public async fetch<T = unknown>(url: string, method: string, options: FetchOptions = {}) {
		const { headers } = options;

		const fetchOptions: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: 'data' in options ? JSON.stringify(options.data) : undefined,
		};

		try {
			const response = await fetch(url, fetchOptions);

			let body: any;
			try {
				body = response.status !== 204 ? await response.json() : null;
			} catch {
				const message = 'Failed to parse JSON response';
				throw new HTTPError(message, response.status);
			}

			if (!response.ok) {
				const message = 'API error';
				throw new HTTPError(message, response.status, body?.errors);
			}

			return body as T;
		} catch (err: any) {
			if (err instanceof HTTPError) {
				throw err;
			}

			throw new HTTPError(err.message ?? 'Network error', 0);
		}
	}
}
