import type { APIErrors } from '$shared/http';
import z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';
import { hasAuth, requireAuth, hasRoles, requireRoles } from '$server/auth/utils';
import { lucia } from '$server/auth/lucia';
import type { RequestEvent, Handle } from '@sveltejs/kit';
import type { Server } from '$server/api/Server';
import { dev } from '$app/environment';

export type SvelteKitHandleResolve = Parameters<Handle>[0]['resolve'];

export type RequestStats = {
	uuid: string;
	method: string;
	url: string;
	userId: number | undefined;
	username: string | undefined;
	ip: string;
	userAgent: string | null;
};
export type ResponseStats = {
	requestId: string;
	method: string;
	status: number;
};

export const STATIC_BASE_PATH = dev ? 'static' : 'client';

export function getRequestStats(req: RequestEvent): RequestStats {
	const { request, locals } = req;
	const { user, uuid } = locals;
	const { method, url } = request;
	return {
		uuid,
		method,
		url,
		userId: user?.id,
		username: user?.username,
		ip: req.getClientAddress(),
		userAgent: request.headers.get('User-Agent'),
	};
}

export function getResponseStats(requestStats: RequestStats, response: Response): ResponseStats {
	const { uuid, method } = requestStats;
	const { status } = response;
	return { requestId: uuid, method, status };
}

/**
 * Wrapper function for API endpoints to ensure
 * errors come back to the client in an expected format
 *
 * TODO: you do lose local SvelteKit RequestHandler inference for
 * route params and id but it's not that big of a deal right now
 */
export function endpoint(action: (req: RequestEvent) => Promise<Response>) {
	return async (req: RequestEvent) => {
		const server = req.locals.server;

		try {
			const result = await action(req);
			return result;
		} catch (err) {
			let errors: APIErrors;
			if (err instanceof z.ZodError) {
				errors = getDisplayZodError(err);
			} else if (err instanceof Error) {
				errors = err.message;
			} else {
				errors = 'Internal server error';
			}

			server.log.error('API error:', {
				requestId: req.locals.uuid,
				error: err,
			});

			return json({ errors }, { status: 400 });
		}
	};
}

export function initRequest(req: RequestEvent, server: Server) {
	req.locals.uuid = uuidv4();
	req.locals.server = server;
	req.locals.hasAuth = () => hasAuth(req);
	req.locals.requireAuth = () => requireAuth(req);
	req.locals.hasRoles = (...roles: string[]) => hasRoles(req, ...roles);
	req.locals.requireRoles = (...roles: string[]) => requireRoles(req, ...roles);
}

export async function resolveRequest(req: RequestEvent, resolve: SvelteKitHandleResolve) {
	const server = req.locals.server;
	const start = Date.now();
	const requestInfo = getRequestStats(req);
	server.log.info('Request:', requestInfo);

	// Runs the request handler
	const response = await resolve(req);

	const requestDuration = Date.now() - start;
	const responseInfo = getResponseStats(requestInfo, response);
	server.log.info('Response:', { ...responseInfo, duration: `${requestDuration}ms` });

	return response;
}

export function handleUnexpectedError(req: RequestEvent, error: unknown, status: number, message: string) {
	const server = req.locals.server;
	server.log.error('SvelteKit error:', {
		requestId: req.locals.uuid,
		error,
	});

	// Fallback to default behaviour
	return undefined;
}

export async function authMiddleware(req: RequestEvent) {
	const sessionId = req.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		req.locals.user = null;
		req.locals.session = null;
	} else {
		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			req.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			req.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
		}

		req.locals.user = user;
		req.locals.session = session;
	}
}

/**
 * Gives you a standardised format that is nicer to work with on the client.
 * NOTE: don't use this for logging as it hides the error stack.
 */
export function getDisplayZodError(error: z.ZodError) {
	const { formErrors, fieldErrors } = error.flatten();
	return { form: formErrors, ...fieldErrors };
}

/**
 * Unfortunately we have to parse JSON field values ourself.
 * Related to the underlying mysql2 package not correctly handling this for MariaDB.
 * See https://github.com/sidorares/node-mysql2/issues/1287
 */
export function parseDBJsonField(data: any) {
	if (data === undefined) {
		return undefined;
	}
	return JSON.parse(data);
}

export const KNOWN_BOT_UAS = [
	// Search engine bots
	'Googlebot',
	'bingbot',
	'Baiduspider',
	'YandexBot',
	'DuckDuckBot',
	'Slurp', // Yahoo
	'Sogou web spider',
	'Exabot',
	'SemrushBot',

	// Social media bots
	'facebookexternalhit',
	'Facebot',
	'Twitterbot',
	'LinkedInBot',
	'Pinterestbot',

	// SEO/Analytics tools
	'AhrefsBot',
	'rogerbot', // Moz
	'MJ12bot', // Majestic
	'Screaming Frog SEO Spider',

	// Monitoring & uptime bots
	'UptimeRobot',
	'StatusCake',
	'Pingdom',

	// General scrapers/parsers
	'python-requests',
	'python',
	'curl',
	'Wget',
	'Java/',
	'libwww-perl',
	'node-fetch',
	'axios',
];
