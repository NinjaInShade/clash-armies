import type { Server } from '$server/api/Server';
import type { RequestEvent } from '@sveltejs/kit';
import type { User } from '$types';
import { parseDBJsonField } from '$server/utils';
import z from 'zod';

type GetUsersOptions = {
	/**
	 * Returns the users with this username.
	 * In practice this will always return one row as usernames are unique.
	 */
	username?: string;
	/** Returns the armies with these ID's */
	ids?: number[];
};

export class UserAPI {
	private server: Server;

	constructor(server: Server) {
		this.server = server;
	}

	public async init() {
		//
	}

	public async dispose() {
		//
	}

	public async getUsers(req: RequestEvent, options: GetUsersOptions = {}) {
		const { username, ids } = options;
		const userId = req.locals.user?.id ?? null;

		const args: (number | number[] | string)[] = [];
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
            WHERE TRUE
        `;

		if (username) {
			query += `
                AND u.username = ?
            `;
			args.push(username);
		}

		if (ids && ids.length) {
			query += `
				AND u.id IN (?)
			`;
			args.push(ids);
		}

		query += `
            GROUP BY u.id
        `;

		const users = await this.server.db.query<User>(query, args);

		for (const user of users) {
			user.roles = parseDBJsonField(user.roles) ?? [];

			// TODO: fetch player level (and other stats if added) from clash of clans API if player tag is defined
			user.level = null;

			if (!req.locals.hasRoles('admin') || userId !== user.id) {
				delete user.googleId;
			}
		}

		return users;
	}

	public async getUser(req: RequestEvent, username: string) {
		const users = await this.getUsers(req, { username });
		if (!users.length) {
			return null;
		}
		return users[0];
	}

	public async getUserById(req: RequestEvent, id: number) {
		const users = await this.getUsers(req, { ids: [id] });
		if (!users.length) {
			return null;
		}
		return users[0];
	}

	public async saveUser(req: RequestEvent, data: unknown) {
		const userSchema = z.object({
			id: z.number(),
			username: z.string().trim().min(3).max(30),
		});

		const authUser = req.locals.requireAuth();

		const user = userSchema.parse(data);
		const { username } = user;

		const usernameRe = /^[a-zA-Z0-9_-]+$/;
		const validUsername = usernameRe.test(username);
		if (!validUsername) {
			throw new Error('Username can only contain english letters, numbers, underscores and hyphens');
		}

		const existing = await this.getUserById(req, user.id);
		if (!existing) {
			throw new Error("This user doesn't exist");
		}

		if (authUser.id === existing.id) {
			// allow user to save his own details
		} else {
			// otherwise must be an admin to save someone elses details
			req.locals.requireRoles('admin');
		}

		const existingUsername = await this.getUser(req, username);
		if (existingUsername && existingUsername.id !== user.id) {
			throw new Error('This username is already taken');
		}

		// prettier-ignore
		await this.server.db.query(`
            UPDATE users SET
                username = ?
            WHERE id = ?
        `, [username, user.id]);
	}
}
