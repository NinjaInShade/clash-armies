import { dev } from '$app/env';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { Server } from '#server/api/Server.ts';
import { db } from '#server/db.ts';
import { Logger } from '#server/logger.ts';
import { initRequest, resolveRequest, handleUnexpectedError, authMiddleware } from '#server/utils.ts';

Logger.showTimestamp = true;
Logger.showDate = !dev;

const server = new Server(db);

export const init: ServerInit = async () => {
	await server.init();
};

export const handle: Handle = async ({ event: req, resolve }) => {
	if (req.url.pathname === '/healthcheck') {
		return new Response('ok', { status: 200 });
	}

	initRequest(req, server);

	await authMiddleware(req);
	await server.army.metrics.requestMiddleware(req);

	return resolveRequest(req, resolve);
};

export const handleError: HandleServerError = async ({ event: req, kind, error }) => {
	if (kind === 'unknown') {
		handleUnexpectedError(req, error);
	}
};

process.on('sveltekit:shutdown', async (reason: 'SIGINT' | 'SIGTERM' | 'IDLE') => {
	await server.dispose(reason);
});
