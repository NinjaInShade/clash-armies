import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { lucia } from '~/lib/server/auth/lucia';

export async function GET(event: RequestEvent): Promise<Response> {
	if (!event.locals.session) {
		// not logged in, redirect to login page
		return redirect(303, '/login');
	}

	await lucia.invalidateSession(event.locals.session.id);
	const sessionCookie = lucia.createBlankSessionCookie();
	event.cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes,
	});

	return redirect(302, '/login');
}
