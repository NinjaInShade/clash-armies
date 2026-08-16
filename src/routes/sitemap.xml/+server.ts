import { SITEMAP_MAX_AGE_SECONDS } from '$server/api/SitemapAPI';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (req) => {
	const server = req.locals.server;
	const xml = await server.sitemap.getSitemap();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': `public, max-age=${SITEMAP_MAX_AGE_SECONDS}`,
		},
	});
};
