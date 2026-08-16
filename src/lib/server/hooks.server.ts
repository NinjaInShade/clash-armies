import { dev } from '$app/environment';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { Server } from '$server/api/Server';
import { db } from '$server/db';
import { Logger } from '$server/logger';
import { initRequest, resolveRequest, handleUnexpectedError, authMiddleware } from '$server/utils';

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

export const handleError: HandleServerError = async ({ event: req, error, status, message }) => {
	handleUnexpectedError(req, error, status, message);
};

process.on('sveltekit:shutdown', async (reason: 'SIGINT' | 'SIGTERM' | 'IDLE') => {
	await server.dispose(reason);
});
