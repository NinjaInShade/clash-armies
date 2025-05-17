import { getUnits, getTownHalls, getEquipment, getPets } from '$server/army';
import type { User, ArmyCtx } from '$types';
import type { Army } from '$models';
import { BANNERS } from '$shared/utils';
import { migration } from '$server/migration';
import { db } from '$server/db';
import chaiSubset from 'chai-subset';
import type { RequestEvent } from '@sveltejs/kit';
import { hasAuth, requireAuth, hasRoles, requireRoles } from '$server/auth/utils';
import * as vitest from 'vitest';

vitest.chai.use(chaiSubset);

export const USER = {
	id: 1,
	googleId: '123',
	username: 'test',
	roles: ['user'],
	playerTag: null,
	level: null,
};
export const USER_2 = {
	id: 2,
	googleId: '123',
	username: 'test-2',
	roles: ['user'],
	playerTag: null,
	level: null,
};
export const USER_ADMIN = {
	id: 3,
	googleId: '123',
	username: 'admin-test',
	roles: ['user', 'admin'],
	playerTag: null,
	level: null,
};

/**
 * Sveltekit request object shim
 */
export function createReq(user: User) {
	const req = {
		locals: {
			hasAuth: () => hasAuth(req),
			requireAuth: () => requireAuth(req),
			hasRoles: (...roles: string[]) => hasRoles(req, ...roles),
			requireRoles: (...roles: string[]) => requireRoles(req, ...roles),
			user,
			session: {
				id: '1',
				userId: user.id,
				expiresAt: new Date('2100-01-01T12:00:00'),
				fresh: false,
			},
		},
	} as unknown as RequestEvent;
	return req;
}

export async function createDB() {
	// Init database & migrate
	await db.connect();
	await db.migrate(migration);
	// Create test users
	const users = [USER, USER_2, USER_ADMIN];
	await db.insertMany(
		'users',
		users.map((user) => ({ username: user.username, googleId: user.googleId }))
	);
	await db.insertMany(
		'user_roles',
		users.flatMap((user) => user.roles.map((role) => ({ userId: user.id, role })))
	);
	return db;
}

export async function destroyDB() {
	await db.dispose();
}

export async function getCtx() {
	const ctx: ArmyCtx = {
		units: await getUnits(),
		townHalls: await getTownHalls(),
		equipment: await getEquipment(),
		pets: await getPets(),
	};
	return ctx;
}

/** Returns an army, defaulting certain fields with dummy data for convenience */
export function makeData(data: Record<string, unknown>): Record<string, any> {
	return { units: [], equipment: [], pets: [], guide: null, banner: BANNERS[0], ...data };
}

export function assertArmies(actual: Army[], expected: Record<string, any>[]) {
	assert.lengthOf(actual, expected.length);
	for (const army of actual) {
		// Army names should be unique when testing to make the assertion easier
		const expectedArmy = expected.find((a) => a.name === army.name);
		if (!expectedArmy) {
			throw new Error(`Expected to have army "${army.name}"`);
		}
		// Assert expected data is included in actual army
		assert.containSubset(army, expectedArmy);
		// Assert lengths
		assert.lengthOf(expectedArmy.units ?? [], army.units.length);
		assert.lengthOf(expectedArmy.equipment ?? [], army.equipment.length);
		assert.lengthOf(expectedArmy.pets ?? [], army.pets.length);
		// Assert misc fields for correct type
		assert.isNumber(army.id);
		assert.instanceOf(army.createdTime, Date);
		assert.instanceOf(army.updatedTime, Date);
		assert.isString(army.username);
		assert.isNumber(army.createdBy);
		assert.isNumber(army.votes);
		assert.isNumber(army.userVote);
		assert.isBoolean(army.userBookmarked);
	}
}

const throwsAsync = async function (fn: (...args: unknown[]) => Promise<unknown>, pattern?: string | RegExp) {
	let error: unknown;
	try {
		await fn();
	} catch (err) {
		error = err;
	}
	vitest.assert.throws(() => {
		if (error) {
			throw error;
		}
	}, pattern);
};
const assert = { ...vitest.assert, throwsAsync };
export { assert };
