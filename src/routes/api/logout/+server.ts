import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { invalidateSession, SESSION_COOKIE_NAME, getBlankSessionCookieAttributes } from '$server/auth/session';

export async function GET(req: RequestEvent): Promise<Response> {
	const redirectTo = req.locals.server.getSafeRedirect(req, {
		considerRefererHeader: true,
	});

	if (req.locals.session) {
		await invalidateSession(req.locals.session.id);
		req.cookies.set(SESSION_COOKIE_NAME, '', getBlankSessionCookieAttributes());
	}

	return redirect(302, redirectTo);
}
