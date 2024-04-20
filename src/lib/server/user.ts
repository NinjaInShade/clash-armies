import type { User } from '~/lib/shared/types';
import { db } from "~/lib/server/db";
import z from 'zod';

type GetUsersParams = {
	username?: string;
};

type GetUserParams = {
	username: string;
}

export async function getUsers(opts: GetUsersParams = {}) {
	const { username } = opts;

	const args: (number | string)[] = [];
	let query = `
        SELECT
			u.id,
            u.username,
            u.playerTag
		FROM users u
    `;

	if (username) {
		query += `
			WHERE u.username = ?
		`;
		args.push(username);
	}

	return db.query<User>(query, args);
}

export async function getUser(opts: GetUserParams) {
	z.object({ username: z.string() }).parse({ username: opts.username });
	const users = await getUsers(opts);
	if (!users.length) {
		return null;
	}
	return users[0];
}
