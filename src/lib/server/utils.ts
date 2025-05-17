import type { FetchErrors } from '$types';
import z from 'zod';
import { json, type RequestEvent } from '@sveltejs/kit';
import { log } from '$server/hooks.server';
import { dev } from '$app/environment';

export const STATIC_BASE_PATH = dev ? 'static' : 'client';

/**
 * Wrapper function for API endpoints to ensure
 * errors come back to the client in an expected format
 *
 * TODO: you do lose local SvelteKit RequestHandler inference for
 * route params and id but it's not that big of a deal right now
 */
export function endpoint(action: (req: RequestEvent) => Promise<Response>) {
	return async (req: RequestEvent) => {
		try {
			const result = await action(req);
			return result;
		} catch (err) {
			let errors: FetchErrors;
			if (err instanceof z.ZodError) {
				const { formErrors, fieldErrors } = err.flatten();
				errors = { form: formErrors, ...fieldErrors };
			} else if (err instanceof Error) {
				errors = err.message;
			} else {
				errors = 'Internal server error';
			}

			log.error('API error:', {
				requestId: req.locals.uuid,
				error: err,
			});

			return json({ errors }, { status: 400 });
		}
	};
}
