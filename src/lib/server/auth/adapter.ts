import type { MySQL } from '@ninjalib/sql';
import type { Session, User } from '$types';
import type { UserId, DatabaseUser, DatabaseSession } from 'lucia';

export class sqlAdapter {
	private db: MySQL;

	constructor(db: MySQL) {
		this.db = db;
	}

	public async deleteExpiredSessions() {
		const query = `
            DELETE FROM sessions
            WHERE expiresAt <= NOW()
        `;
		await this.db.query(query);
	}

	public async deleteSession(sessionId: string) {
		const query = `
            DELETE FROM sessions
            WHERE id = ?
        `;
		await this.db.query(query, [sessionId]);
	}

	public async deleteUserSessions(userId: UserId) {
		const query = `
            DELETE FROM sessions
            WHERE userId = ?
        `;
		await this.db.query(query, [userId]);
	}

	public async getSessionAndUser(sessionId: string) {
		const promise: Promise<[DatabaseSession | null, DatabaseUser | null]> = Promise.all([this.getDatabaseSession(sessionId), this.getDatabaseUser(sessionId)]);
		return promise;
	}

	public getUserSessions(userId: UserId) {
		return this.db.getRows<DatabaseSession>('sessions', { userId });
	}

	public async setSession(session: DatabaseSession) {
		await this.db.insertOne('sessions', {
			id: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt,
		});
	}

	public async updateSessionExpiration(sessionId: string, expiresAt: Date) {
		const query = `
            UPDATE sessions SET
                expiresAt = ?
            WHERE id = ?
        `;
		await this.db.query(query, [expiresAt, sessionId]);
	}

	private async getDatabaseSession(sessionId: string): Promise<DatabaseSession | null> {
		const session = await this.db.getRow<Session, null>('sessions', { id: sessionId });
		if (!session) {
			return null;
		}
		const { id, userId, expiresAt } = session;
		return { id, userId, expiresAt, attributes: {} };
	}

	private async getDatabaseUser(sessionId: string): Promise<DatabaseUser | null> {
		const session = await this.db.getRow<Session, null>('sessions', { id: sessionId });
		if (!session) {
			return null;
		}
		const user = await this.db.getRow<User, null>('users', { id: session.userId });
		if (!user) {
			return null;
		}
		const userRoles = await this.db.getRows<{ userId: number; role: string }>('user_roles', { userId: user.id });
		const { id, googleId, username, playerTag } = user;
		return { id, attributes: { username, googleId, playerTag, roles: userRoles.map((x) => x.role) } };
	}
}
