import type { User } from '~/lib/shared/types';
import { db } from '~/lib/server/db';
import z from 'zod';
import type { RequestEvent } from '@sveltejs/kit';
import type { Request } from '~/app';

type GetUsersParams = {
	req: Request;
	username?: string;
};

export async function getUsers(opts: GetUsersParams) {
	const { req, username } = opts;

	const args: (number | string)[] = [];
	let query = `
        SELECT
			u.googleId,
			u.id,
			u.googleId,
			JSON_ARRAYAGG(ur.role) AS roles,
            u.username,
            u.playerTag
		FROM users u
		LEFT JOIN user_roles ur ON ur.userId = u.id
    `;

	if (username) {
		query += `
			WHERE u.username = ?
		`;
		args.push(username);
	}

	query += `
		GROUP BY u.id
	`;

	const users = await db.query<User>(query, args);
	for (const user of users) {
		user.roles = JSON.parse(user.roles);

		// TODO: fetch player level (and other stats if added) from clash of clans API if player tag is defined
		user.level = null;

		if (!req.hasRoles('admin') || req.user?.id !== user.id) {
			delete user.googleId;
		}
	}
	return users;
}

export async function getUser(req: Request, username: string) {
	z.object({ username: z.string() }).parse({ username });
	const users = await getUsers({ req, username });
	if (!users.length) {
		return null;
	}
	return users[0];
}

const userSchema = z.object({
	id: z.number(),
	username: z.string().trim().min(3).max(30),
})

export async function saveUser(event: RequestEvent, userData: Partial<User>) {
	const authUser = event.locals.requireAuth();
	const user = userSchema.parse(userData);
	const { username } = user;

	const usernameRe = /^[a-zA-Z0-9_-]+$/
	const validUsername = usernameRe.test(username);
	if (!validUsername) {
		throw new Error("Username can only contain english letters, numbers, underscores and hyphens");
	}

	const existing = await db.getRow<User, null>('users', { id: user.id });
	if (!existing) {
		throw new Error("This user doesn't exist");
	}

	const usernameExists = await db.getRows<User>('users', { username });
	if (usernameExists.find(u => u.id !== user.id)) {
		throw new Error("This username is already taken");
	}

	if (authUser.id === existing.id) {
		// allow user to save his own details
	} else {
		// otherwise must be an admin to save someone elses details
		event.locals.requireRoles('admin');
	}

	const query = `
		UPDATE users SET
			username = ?
		WHERE id = ?
	`;
	await db.query(query, [username, user.id]);

}
