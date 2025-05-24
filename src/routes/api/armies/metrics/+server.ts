import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';
import { PAGE_VIEW_METRIC, COPY_LINK_CLICK_METRIC, OPEN_LINK_CLICK_METRIC } from '$shared/utils';
import z from 'zod';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();
	const dataSchema = z.object({ metric: z.string(), armyId: z.number() });

	const { metric, armyId } = dataSchema.parse(data);
	const invalidMetricErr = new Error('Invalid metric');

	if (metric === PAGE_VIEW_METRIC) {
		await server.army.metrics.reportPageView(req, armyId);
	} else if (metric === COPY_LINK_CLICK_METRIC) {
		await server.army.metrics.reportCopyLinkClick(req, armyId);
	} else if (metric === OPEN_LINK_CLICK_METRIC) {
		await server.army.metrics.reportOpenLinkClick(req, armyId);
	} else {
		throw invalidMetricErr;
	}

	return json({}, { status: 200 });
});
