import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { lucia } from '$server/auth/lucia';

export async function GET(req: RequestEvent): Promise<Response> {
	const redirectTo = req.locals.server.getSafeRedirect(req, {
		considerRefererHeader: true,
	});

	if (req.locals.session) {
		await lucia.invalidateSession(req.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		req.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}

	return redirect(302, redirectTo);
}
