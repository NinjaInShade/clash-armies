import type { User } from '~/lib/shared/types';
import { db } from "~/lib/server/db";
import z from 'zod';

type GetUsersParams = {
	username?: string;
};

export async function getUsers(opts: GetUsersParams = {}) {
	const { username } = opts;

	const args: (number | string)[] = [];
	let query = `
        SELECT
			u.id,
			u.googleId,
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

	// TODO: fetch player level (and other stats if added) from clash of clans API if player tag is defined

	return db.query<User>(query, args);
}

export async function getUser(username: string) {
	z.object({ username: z.string() }).parse({ username });
	const users = await getUsers({ username });
	if (!users.length) {
		return null;
	}
	return users[0];
}
