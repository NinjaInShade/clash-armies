import type { FetchErrors } from '$types';
import z from 'zod';
import { json, type RequestEvent } from '@sveltejs/kit';
import { log, getRequestInfo } from '$server/hooks.server';
import { dev } from '$app/environment';

export const STATIC_BASE_PATH = dev ? 'static' : 'client';

/**
 * Wrapper function for API endpoints to ensure errors come back to the client in an expected format
 */
export async function middleware(event: RequestEvent, fn: () => Promise<Response>) {
	try {
		const result = await fn();
		return result;
	} catch (err) {
		let body: { errors: FetchErrors };
		if (err instanceof z.ZodError) {
			body = { errors: err.flatten().fieldErrors };
		} else if (err instanceof Error) {
			body = { errors: err.message };
		} else {
			body = { errors: 'Invalid error' };
		}
		log.error('API error:', getRequestInfo(event), err);
		return json(body, { status: 400 });
	}
}
