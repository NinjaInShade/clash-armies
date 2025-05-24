import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { db } from '$server/db';
import { initRequest, resolveRequest, handleUnexpectedError, authMiddleware } from '$server/utils';
import { Server } from '$server/api/Server';
import { dev } from '$app/environment';
import util from '@ninjalib/util';

util.Logger.showTimestamp = true;
util.Logger.showDate = !dev;

const server = new Server(db);

export const init: ServerInit = async () => {
	await server.init();
};

export const handle: Handle = async ({ event: req, resolve }) => {
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
