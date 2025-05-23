import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { lucia } from '$server/auth/lucia';

export async function GET(req: RequestEvent): Promise<Response> {
	if (!req.locals.session) {
		// not logged in, redirect to login page
		return redirect(303, '/login');
	}

	await lucia.invalidateSession(req.locals.session.id);
	const sessionCookie = lucia.createBlankSessionCookie();
	req.cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes,
	});

	return redirect(302, '/login');
}
