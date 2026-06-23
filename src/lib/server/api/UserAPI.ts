import type { Server } from '$server/api/Server';
import type { RequestEvent } from '@sveltejs/kit';
import type { User } from '$types';
import { helpers } from '$server/db';
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

		let query = this.server.db.selectFrom('users as u').leftJoin('user_roles as ur', 'ur.userId', 'u.id');

		if (username) {
			query = query.where('u.username', '=', username);
		}

		if (ids && ids.length) {
			query = query.where('u.id', 'in', ids);
		}

		const users: User[] = await query
			.select(['u.googleId', 'u.id', helpers.jsonAgg('ur.role').as('roles'), 'u.username', 'u.playerTag', 'u.createdTime'])
			.groupBy('u.id')
			.execute();

		for (const user of users) {
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
			playerTag: z.string().trim().max(15).nullable(),
		});

		const authUser = req.locals.requireAuth();

		const user = userSchema.parse(data);
		const { username, playerTag } = user;

		const usernameRe = /^[a-zA-Z0-9_-]+$/;
		const validUsername = usernameRe.test(username);
		if (!validUsername) {
			throw new Error('Username can only contain english letters, numbers, underscores and hyphens');
		}

		if (playerTag !== null) {
			const playerTagRe = /^#[0289CGJLPQRUVY]+$/i;
			if (!playerTagRe.test(playerTag)) {
				throw new Error('Invalid player tag format');
			}
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

		await this.server.db.updateTable('users').where('id', '=', user.id).set({ username, playerTag }).execute();
	}
}
