import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import { assert, EVENT, REQ, USER, USER_2, ADMIN_USER, createEvent, getCtx, createDB, destroyDB, makeData, assertArmies } from '../testutil';
import type { UnitType, ArmyCtx } from '$types';
import { ArmyModel, UnitModel, PetModel, EquipmentModel } from '$models';
import { validateArmy } from '$shared/validation';
import { GUIDE_TEXT_CHAR_LIMIT } from '$shared/utils';
import { getArmies, saveArmy, saveComment } from '$server/army';
import { getNotifications, acknowledgeNotifications } from '$server/notifications';
import type { MySQL } from '@ninjalib/sql';

let db: MySQL;
let ctx: ArmyCtx;

beforeAll(async function () {
	db = await createDB();
	ctx = await getCtx();
});

afterAll(async function () {
	await destroyDB();
});

describe('Saving', function () {
	afterEach(async function () {
		await db.delete('armies');
	});

	describe('New', function () {
		it('Should save army with units', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
				],
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			assertArmies(armies, [data]);
		});

		it('Should save army with units and cc', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
				],
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			assertArmies(armies, [data]);
		});

		it('Should save army with units, cc and equipment', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
				],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', ctx).id },
				],
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			assertArmies(armies, [data]);
		});

		it('Should save army with units, cc, equipment and pets', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
				],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', ctx).id },
				],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', ctx).id },
					{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', ctx).id },
				],
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			assertArmies(armies, [data]);
		});

		it('Should save army with guide', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: '<p>Guide!</p>',
					youtubeUrl: null,
				},
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			assertArmies(armies, [data]);
		});

		it('Should merge empty guide tags into one', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: `
						<p></p>
						<p></p>
						<p></p>
						<p></p>
					`,
					youtubeUrl: null,
				},
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			// Expect one empty tag
			data.guide.textContent = '<p></p>';
			assertArmies(armies, [data]);
		});
	});

	describe('Existing', function () {
		it("Should add new units that weren't present before", async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
				],
				equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id }],
				pets: [{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', ctx).id }],
			});
			await saveArmy(EVENT, data);
			const army = (await getArmies(REQ))[0];
			// Add units
			army.units.push(
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 5 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 5 }
			);
			army.equipment.push({ equipmentId: EquipmentModel.requireByName('Rage Vial', ctx).id });
			army.pets.push({ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', ctx).id });
			await saveArmy(EVENT, army);
			const armySaved = (await getArmies(REQ))[0];
			assertArmies([armySaved], [army]);
		});

		it('Should remove units that are no longer in the army', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 5 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 5 },
				],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', ctx).id },
				],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', ctx).id },
					{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', ctx).id },
				],
			});
			await saveArmy(EVENT, data);
			const army = (await getArmies(REQ))[0];
			// Remove units
			army.units = army.units.filter((u) => u.name !== 'Archer');
			army.equipment = army.equipment.filter((eq) => eq.name !== 'Rage Vial');
			army.pets = army.pets.filter((p) => p.name !== 'Spirit Fox');
			await saveArmy(EVENT, army);
			const armySaved = (await getArmies(REQ))[0];
			assertArmies([armySaved], [army]);
		});

		it('Should save different unit amount', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
			});
			await saveArmy(EVENT, data);
			const army = (await getArmies(REQ))[0];
			// Update amount
			army.units[0].amount = 20;
			await saveArmy(EVENT, army);
			const armySaved = (await getArmies(REQ))[0];
			assertArmies([armySaved], [army]);
		});

		it('Should remove guide if it was removed', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: '<p>Guide!</p>',
					youtubeUrl: null,
				},
			});
			await saveArmy(EVENT, data);
			const army = (await getArmies(REQ))[0];
			// Remove guide
			army.guide = null;
			await saveArmy(EVENT, army);
			const armySaved = (await getArmies(REQ))[0];
			assertArmies([armySaved], [army]);
		});
	});
});

describe('Fetching', function () {
	afterEach(async function () {
		await db.delete('armies');
	});

	it('Should not return duplicate entries for JSON fields', async function () {
		const data = makeData({
			name: 'test',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', ctx).id, amount: 10 },
			],
			equipment: [
				{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
				{ equipmentId: EquipmentModel.requireByName('Rage Vial', ctx).id },
			],
			pets: [
				{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', ctx).id },
				{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', ctx).id },
			],
		});
		const data2 = { ...data, name: 'test2' };
		// Create two armies
		await saveArmy(EVENT, data);
		await saveArmy(EVENT, data2);
		// Assert  units/equipment/pets length matches for each army (assertArmies handles this)
		const armies = await getArmies(REQ);
		assertArmies(armies, [data, data2]);
	});
});

describe('Army comments', function () {
	let armyId: number;
	let armyId2: number;

	beforeAll(async function () {
		// Create test armies for saving comments
		const data = makeData({
			name: 'test',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 5 }],
		});
		const data2 = makeData({
			name: 'test2',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 5 }],
		});
		armyId = await saveArmy(EVENT, data);
		armyId2 = await saveArmy(EVENT, data2);
	});

	afterEach(async function () {
		await db.delete('army_comments');
	});

	it('Should be able to create a comment', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await saveComment(EVENT, data);
		const comment = await db.getRow('army_comments', { id });
		assert.include(comment, {
			armyId,
			comment: 'Test comment',
			replyTo: null,
			createdBy: USER.id,
		});
	});

	it('Should be able to edit existing comment text', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await saveComment(EVENT, data);
		const newData = { ...data, id, comment: 'Test comment updated' };
		await saveComment(EVENT, newData);
		const comment = await db.getRow('army_comments', { id });
		assert.include(comment, {
			armyId,
			comment: 'Test comment updated',
			replyTo: null,
			createdBy: USER.id,
		});
	});

	it('Should throw if armyId or replyTo for comment changed', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await saveComment(EVENT, data);

		// Ensure changing armyId throws
		await assert.throwsAsync(async function () {
			const newData = { ...data, id, armyId: armyId2 };
			await saveComment(EVENT, newData);
		}, 'Moving comments is not allowed');

		// Ensure changing replyTo throws
		await assert.throwsAsync(async function () {
			const newData = { ...data, id, replyTo: 1 };
			await saveComment(EVENT, newData);
		}, 'Moving comments is not allowed');
	});

	it('Should be able to reply to other comments', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await saveComment(EVENT, data);
		const replyingData = {
			armyId,
			comment: 'Replying',
			replyTo: id,
		};
		const replyId = await saveComment(EVENT, replyingData);
		const comment = await db.getRow('army_comments', { id: replyId });
		assert.include(comment, {
			armyId,
			comment: 'Replying',
			replyTo: id,
			createdBy: USER.id,
		});
	});

	it('Should not be able to edit other peoples comments (unless admin)', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await saveComment(EVENT, data);

		try {
			// Saving this comment with another non-admin user should throw
			const USER_2_EVENT = createEvent(USER_2);
			await saveComment(USER_2_EVENT, { ...data, id, comment: 'Updated ' });
			assert.fail('Expected error');
		} catch (err: any) {
			assert.equal(err.body.message, "You don't have permission to do this warrior!");
			// Assert comment was not changed
			const comment = await db.getRow('army_comments', { id });
			assert.include(comment, { ...data, createdBy: USER.id });
		}

		// Admin should be able to save any comment
		const ADMIN_EVENT = createEvent(ADMIN_USER);
		await saveComment(ADMIN_EVENT, { ...data, id, comment: 'Updated ' });
		const comment = await db.getRow('army_comments', { id });
		assert.include(comment, { ...data, createdBy: USER.id, comment: 'Updated' });
	});
});

describe('Army notifications', function () {
	const USER_1_EVENT = createEvent(USER);
	const USER_2_EVENT = createEvent(USER_2);
	const ADMIN_EVENT = createEvent(ADMIN_USER);

	let armyId: number;

	beforeAll(async function () {
		const data = makeData({
			name: 'test',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 5 }],
		});
		armyId = await saveArmy(USER_1_EVENT, data);
	});

	afterEach(async function () {
		await db.delete('army_comments');
		await db.delete('army_notifications');
	});

	describe('Comment', function () {
		it('should notify army creator if someone comments', async function () {
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await saveComment(USER_2_EVENT, data);
			const notifications = await getNotifications(USER.id);
			assert.lengthOf(notifications, 1);
			assert.include(notifications[0], { armyId, commentId, type: 'comment', recipientId: USER.id, triggeringUserId: USER_2.id });
		});

		it('should not notify army creator if they comment on their own army', async function () {
			const data = { armyId, comment: 'Comment...', replyTo: null };
			await saveComment(USER_1_EVENT, data);
			const notifications = await getNotifications(USER.id);
			assert.lengthOf(notifications, 0);
		});
	});

	describe('Comment reply', function () {
		it('should notify commenter if someone replies', async function () {
			// Comment on own army (should not notify)
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await saveComment(USER_1_EVENT, data);

			// Another user replies (should notify, but with type "comment-reply")
			const data2 = { armyId, comment: 'Comment reply...', replyTo: commentId };
			const commentId2 = await saveComment(USER_2_EVENT, data2);

			const notifications = await getNotifications(USER.id);
			assert.lengthOf(notifications, 1);
			assert.include(notifications[0], { armyId, commentId: commentId2, type: 'comment-reply', recipientId: USER.id, triggeringUserId: USER_2.id });
		});

		it('should not notify commenter if they reply to themselves', async function () {
			// Comment on user army
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await saveComment(USER_2_EVENT, data);

			// Reply to self
			const data2 = { armyId, comment: 'Comment reply...', replyTo: commentId };
			await saveComment(USER_2_EVENT, data2);

			// Should be 2 notifications, but only to the army creator of 2 new comments
			const notifications = await getNotifications(USER.id);
			assert.lengthOf(notifications, 2);
			assert.include(notifications[0], { armyId, type: 'comment', recipientId: USER.id, triggeringUserId: USER_2.id });
			assert.include(notifications[1], { armyId, type: 'comment', recipientId: USER.id, triggeringUserId: USER_2.id });
		});

		it('should not notify army creator if they reply to someone else', async function () {
			// Comment on user army
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await saveComment(USER_2_EVENT, data);

			// Reply to comment as the army creator
			const data2 = { armyId, comment: 'Comment reply...', replyTo: commentId };
			await saveComment(USER_1_EVENT, data2);

			// Should be 2 notifications, one to the creator that someone commented, and another to the commenter as the creator replied
			const notificationsCreator = await getNotifications(USER.id);
			assert.lengthOf(notificationsCreator, 1);
			assert.include(notificationsCreator[0], { armyId, type: 'comment', recipientId: USER.id, triggeringUserId: USER_2.id });

			const notificationsCommenter = await getNotifications(USER_2.id);
			assert.lengthOf(notificationsCommenter, 1);
			assert.include(notificationsCommenter[0], { armyId, type: 'comment-reply', recipientId: USER_2.id, triggeringUserId: USER.id });
		});
	});

	describe('Acknowledgement', function () {
		it("should not allow user to acknowledge other users' notifications, unless admin", async function () {
			// Comment on user army
			const data = { armyId, comment: 'Comment...', replyTo: null };
			await saveComment(USER_2_EVENT, data);
			const notificationId = (await getNotifications(USER.id))[0]?.id;

			await assert.throwsAsync(async () => {
				// Acknowledging the notification with a different non-admin user should throw
				await acknowledgeNotifications(USER_2_EVENT, [notificationId]);
			}, "Cannot acknowledge notifications that aren't yours");

			// Should not have changed if the notification has been acknowledged
			assert.strictEqual((await getNotifications(USER.id))[0]?.seen, null);

			// Admin should be able to acknowledge
			await acknowledgeNotifications(ADMIN_EVENT, [notificationId]);
			assert.instanceOf((await getNotifications(USER.id))[0]?.seen, Date);
		});
	});
});

describe('Validation', function () {
	function testCapacity(type: UnitType, clanCastle: boolean) {
		function _testCapacity(overflow: boolean) {
			const th = ArmyModel.requireTownHall(16, ctx);
			const longType = type === 'Siege' ? 'siege machine' : type.toLowerCase();
			const maxCapacity = clanCastle ? th[`cc${type}Capacity`] : th[`${type.toLowerCase()}Capacity`];
			const data = makeData({
				name: 'test',
				townHall: th.level,
				units: [{ home: clanCastle ? 'clanCastle' : 'armyCamp', unitId: ctx.units.find((u) => u.type === type)?.id, amount: maxCapacity + (overflow ? 1 : 0) }],
			});
			if (overflow) {
				const msg = `Town hall ${th.level} has a max ${clanCastle ? 'clan castle ' : ''}${longType} capacity of ${maxCapacity}, but this army exceeded that with ${maxCapacity + 1}`;
				assert.throws(function () {
					validateArmy(data, ctx);
				}, msg);
			} else {
				// Should not throw
				validateArmy(data, ctx);
			}
		}
		// Test we don't throw if capacity is just within bounds, but throw if we exceed it
		_testCapacity(false);
		_testCapacity(true);
	}

	function testDuplicate(clanCastle: boolean) {
		const home = clanCastle ? 'clanCastle' : 'armyCamp';
		const data = makeData({
			name: 'test',
			townHall: 16,
			units: [
				{ home, unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 },
				{ home, unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 },
			],
		});
		assert.throws(
			function () {
				validateArmy(data, ctx);
			},
			`Duplicate ${clanCastle ? 'clan castle ' : ''}unit "Barbarian" found`
		);
	}

	it('Should not allow more than 4 heroes', function () {
		// The amount of heroes used by an army is defined by what equipment/pets are used
		const data = makeData({
			name: 'test',
			townHall: 6,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 }],
			equipment: [
				// Barbarian King equipment
				{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
				// Archer Queen equipment
				{ equipmentId: EquipmentModel.requireByName('Archer Puppet', ctx).id },
				// Royal Champion equipment
				{ equipmentId: EquipmentModel.requireByName('Rocket Spear', ctx).id },
				// Grand Warden equipment
				{ equipmentId: EquipmentModel.requireByName('Eternal Tome', ctx).id },
			],
			pets: [
				// Minion Prince
				{ hero: 'Minion Prince', petId: PetModel.requireByName('Lassi', ctx).id },
			],
		});
		assert.throws(function () {
			validateArmy(data, ctx);
		}, 'Cannot use more than 4 heroes');
	});

	describe('Regular units', function () {
		it('Should not allow units to overflow max capacity', function () {
			testCapacity('Troop', false);
			testCapacity('Spell', false);
			testCapacity('Siege', false);
		});

		it('should not allow duplicate units', function () {
			testDuplicate(false);
		});

		it('Should not allow more than two unique super troops', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Barbarian', ctx).id, amount: 1 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Archer', ctx).id, amount: 1 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Miner', ctx).id, amount: 1 },
				],
			});
			// Should throw with 3 unique super troops
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'An army can have a maximum of two unique super troops');
			// Should not throw now with 2 unique super troops
			data.units?.splice(0, 1);
			validateArmy(data, ctx);
		});

		it('Should not allow super troops before town hall 11', function () {
			const data = makeData({
				name: 'test',
				townHall: 10,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Barbarian', ctx).id, amount: 1 }],
			});
			// Should throw at town hall 10
			assert.throws(function () {
				validateArmy(data, ctx);
			}, `Unit "Super Barbarian" isn't available at town hall 10`);
			// Should not throw at town hall 11
			data.townHall = 11;
			validateArmy(data, ctx);
		});

		it('Should not allow spells before town hall 5', function () {
			const data = makeData({
				name: 'test',
				townHall: 4,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireSpellByName('Lightning', ctx).id, amount: 1 }],
			});
			// Should throw at town hall 4
			assert.throws(function () {
				validateArmy(data, ctx);
			}, `Town hall 4 has a max spell capacity of 0, but this army exceeded that with 1`);
			// Should not throw at town hall 5
			data.townHall = 5;
			validateArmy(data, ctx);
		});

		it('Should not allow siege machines before town hall 12', function () {
			const data = makeData({
				name: 'test',
				townHall: 11,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Wall Wrecker', ctx).id, amount: 1 }],
			});
			// Should throw at town hall 11
			assert.throws(function () {
				validateArmy(data, ctx);
			}, `Town hall 11 has a max siege machine capacity of 0, but this army exceeded that with 1`);
			// Should not throw at town hall 12
			data.townHall = 12;
			validateArmy(data, ctx);
		});
	});

	describe('Clan castle units', function () {
		it('Should not allow units to overflow max capacity', function () {
			testCapacity('Troop', true);
			testCapacity('Spell', true);
			testCapacity('Siege', true);
		});

		it('should not allow duplicate units', function () {
			testDuplicate(true);
		});

		it('Should allow more than two unique super troops', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Barbarian', ctx).id, amount: 1 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Archer', ctx).id, amount: 1 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Miner', ctx).id, amount: 1 },
				],
			});
			// Should not throw even with more than 2 unique super troops
			validateArmy(data, ctx);
		});

		it('Should only allow super troop if the regular troop version is at a high enough level to be boosted', function () {
			// Super valkyrie must be level 7 to be boosted (which requires lab level 10)
			const thLabLvl9 = ctx.townHalls.find((th) => th.maxLaboratory === 9);
			const thLabLvl10 = ctx.townHalls.find((th) => th.maxLaboratory === 10);
			if (!thLabLvl9 || !thLabLvl10) {
				throw new Error('Expected town hall data');
			}
			const data = makeData({
				name: 'test',
				townHall: thLabLvl9.level,
				units: [{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Valkyrie', ctx).id, amount: 1 }],
			});
			// Should throw when lab is level 9
			assert.throws(function () {
				validateArmy(data, ctx);
			}, `Clan castle unit "Super Valkyrie" isn't available at town hall ${thLabLvl9.level}`);
			// Should not throw when lab is level 10
			data.townHall = thLabLvl10.level;
			validateArmy(data, ctx);
		});

		it('Should only allow battle drill once clan castle level 9 is unlocked', function () {
			const thCcLvl8 = ctx.townHalls.find((th) => th.maxCc === 8);
			const thCcLvl9 = ctx.townHalls.find((th) => th.maxCc === 9);
			if (!thCcLvl8 || !thCcLvl9) {
				throw new Error('Expected town hall data');
			}
			const data = makeData({
				name: 'test',
				townHall: thCcLvl8.level,
				units: [{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Battle Drill', ctx).id, amount: 1 }],
			});
			// Should throw when clan castle is level 8
			assert.throws(function () {
				validateArmy(data, ctx);
			}, `Clan castle unit "Battle Drill" isn't available at town hall ${thCcLvl8.level}`);
			// Should not throw when clan castle is level 9
			data.townHall = thCcLvl9.level;
			validateArmy(data, ctx);
		});
	});

	describe('Equipment', function () {
		it("Should not allow equipment for a hero that isn't unlocked yet", function () {
			const data = makeData({
				name: 'test',
				townHall: 6,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 }],
				equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id }],
			});
			// Should throw at town hall level 6 as king isn't unlocked yet
			assert.throws(function () {
				validateArmy(data, ctx);
			}, `Equipment "Barbarian Puppet" can't be used as the barbarian king isn't unlocked at town hall 6`);
			// Should not throw at town hall 7 as king is unlocked
			data.townHall = 7;
			validateArmy(data, ctx);
		});

		it('Should not allow hero to have duplicate equipment', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 }],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Duplicate equipment "Barbarian Puppet" on barbarian king');
		});

		it('Should not allow hero to have more than two equipments', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 }],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', ctx).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', ctx).id },
					{ equipmentId: EquipmentModel.requireByName('Earthquake Boots', ctx).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Hero barbarian king cannot have more than two pieces of equipment');
		});
	});

	describe('Pets', async function () {
		it('Should not allow a hero to have multiple pets', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 }],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', ctx).id },
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Spirit Fox', ctx).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Hero barbarian king cannot have more than one pet');
		});

		it('Should not allow the same pet on multiple heroes', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 1 }],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Mighty Yak', ctx).id },
					{ hero: 'Archer Queen', petId: PetModel.requireByName('Mighty Yak', ctx).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Pet "Mighty Yak" has already been assigned to another hero');
		});
	});

	describe('Guide', function () {
		it('Should make sure there is either text content or a youtube URL', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: null,
					youtubeUrl: null,
				},
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Guide must have at least either text content or YouTube video URL');
		});

		it('Should not allow invalid youtube URLs', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: null,
					youtubeUrl: 'https://www.youtube.com/invalid-url',
				},
			});
			const invalidURLs = [
				'https://www.random.com',
				'https://www.youtube.com/invalid-url',
				'http://www.youtube.com/watch?v=ZxWrWMDJS8Q', // HTTP
				'https://www.youtube.com/watch?v=ZxWrWMDJS8', // Invalid ID length (10 instead of 11)
			];
			const validURLs = [
				'https://www.youtube.com/watch?v=ZxWrWMDJS8Q',
				'https://youtube.com/watch?v=ZxWrWMDJS8Q', // No www
				'https://www.youtube.com/watch?v=ZxWrWMDJS8Q&t=4s', // Has time param
			];
			for (const invalid of invalidURLs) {
				data.guide.youtubeUrl = invalid;
				assert.throws(function () {
					validateArmy(data, ctx);
				}, 'Guide has an invalid YouTube URL');
			}
			for (const valid of validURLs) {
				// Should not throw as now the youtube URL is valid
				data.guide.youtubeUrl = valid;
				validateArmy(data, ctx);
			}
		});

		it('Should not allow empty text content', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: '',
					youtubeUrl: null,
				},
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Guide must have at least either text content or YouTube video URL');
		});

		it('Should not allow text content to go over the max char limit', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', ctx).id, amount: 10 }],
				guide: {
					textContent: `<p>${'a'.repeat(GUIDE_TEXT_CHAR_LIMIT + 1)}</p>`,
					youtubeUrl: null,
				},
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Guide text content exceeded the character limit');
			// Should not fail now as within limit
			data.guide.textContent = `<p>${'a'.repeat(GUIDE_TEXT_CHAR_LIMIT)}</p>`;
			validateArmy(data, ctx);
		});
	});
});
