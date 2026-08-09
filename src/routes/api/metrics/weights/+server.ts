import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const weights = await server.army.metrics.updateMetricWeights(req, data);

	return json(weights, { status: 200 });
});
