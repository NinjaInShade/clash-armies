import { getUnits, getTownHalls, getEquipment, getPets } from '$server/army';
import type { SaveArmy, Army, User } from '$types';
import type { Ctx } from '$shared/validation';
import { BANNERS } from '$shared/utils';
import { migration } from '$server/migration';
import { db } from '$server/db';
import chai from 'chai';
import chaiSubset from 'chai-subset';
import type { RequestEvent } from '@sveltejs/kit';
import { hasAuth, requireAuth, hasRoles, requireRoles } from '$server/auth/utils';

chai.use(chaiSubset);

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
export const ADMIN_USER = {
	id: 3,
	googleId: '123',
	username: 'admin-test',
	roles: ['user', 'admin'],
	playerTag: null,
	level: null,
};
export const EVENT = createEvent(USER);
export const ADMIN_EVENT = createEvent(ADMIN_USER);
export const REQ = { req: EVENT.locals };

/**
 * Sveltekit event object shim
 */
export function createEvent(user: User) {
	const event = {
		locals: {
			hasAuth: () => hasAuth(event),
			requireAuth: () => requireAuth(event),
			hasRoles: (...roles: string[]) => hasRoles(event, ...roles),
			requireRoles: (...roles: string[]) => requireRoles(event, ...roles),
			user,
			session: {
				id: '1',
				userId: user.id,
				expiresAt: new Date('2100-01-01T12:00:00'),
				fresh: false,
			},
		},
	} as unknown as RequestEvent;
	return event;
}

export async function createDB() {
	// Init database & migrate
	await db.connect();
	await db.migrate(migration);
	// Create basic test user
	const userId = await db.insertOne('users', { username: USER.username, googleId: USER.googleId });
	await db.insertOne('user_roles', { userId, role: USER.roles[0] });
	return db;
}

export async function destroyDB() {
	await db.dispose();
}

export async function getCtx() {
	const ctx: Ctx = {
		units: await getUnits(),
		townHalls: await getTownHalls(),
		equipment: await getEquipment(),
		pets: await getPets(),
	};
	return ctx;
}

/** Returns an army, defaulting certain fields with dummy data for convenience */
export function makeData(data: Record<string, unknown>) {
	return { units: [], equipment: [], pets: [], guide: null, banner: BANNERS[0], ...data } as unknown as SaveArmy;
}

export function assertArmies(actual: Army[], expected: SaveArmy[]) {
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

export function requireTh(level: number, ctx: Ctx) {
	const th = ctx.townHalls.find((th) => th.level === level);
	if (!th) {
		throw new Error(`Expected town hall "${level}"`);
	}
	return th;
}

export function requireUnit(name: string, ctx: Ctx) {
	const unit = ctx.units.find((u) => u.name === name);
	if (!unit) {
		throw new Error(`Expected unit "${name}"`);
	}
	return unit;
}

export function requireEquipment(name: string, ctx: Ctx) {
	const eq = ctx.equipment.find((eq) => eq.name === name);
	if (!eq) {
		throw new Error(`Expected equipment "${name}"`);
	}
	return eq;
}

export function requirePet(name: string, ctx: Ctx) {
	const pet = ctx.pets.find((p) => p.name === name);
	if (!pet) {
		throw new Error(`Expected pet "${name}"`);
	}
	return pet;
}

const throwsAsync = async function (fn: (...args: unknown[]) => Promise<unknown>, pattern?: string | RegExp) {
	let error: unknown;
	try {
		await fn();
	} catch (err) {
		error = err;
	}
	chai.assert.throws(() => {
		if (error) {
			throw error;
		}
	}, pattern);
};
const assert = { ...chai.assert, throwsAsync };
export { assert };
