import { describe, it, before, after, afterEach } from 'node:test';
import {
	assert,
	EVENT,
	REQ,
	getCtx,
	createDB,
	destroyDB,
	resetDB,
	makeData,
	assertArmies,
	requireTh,
	requireUnit,
	requireEquipment,
	requirePet,
} from '../testutil';
import type { UnitType } from '~/lib/shared/types';
import { validateArmy, type Ctx } from '~/lib/shared/validation';
import { getArmies, saveArmy } from '~/lib/server/army';

describe('Saving', function () {
	let ctx: Ctx;

	before(async function () {
		await createDB();
		ctx = await getCtx();
	});

	after(async function () {
		await destroyDB();
	});

	afterEach(async function () {
		await resetDB();
	});

	describe('New', function () {
		it('Should save army with units', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 10 },
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
					{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Archer', ctx).id, amount: 10 },
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
					{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Archer', ctx).id, amount: 10 },
				],
				equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }, { equipmentId: requireEquipment('Rage Vial', ctx).id }],
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
					{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Archer', ctx).id, amount: 10 },
				],
				equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }, { equipmentId: requireEquipment('Rage Vial', ctx).id }],
				pets: [
					{ hero: 'Barbarian King', petId: requirePet('Lassi', ctx).id },
					{ hero: 'Archer Queen', petId: requirePet('Spirit Fox', ctx).id },
				],
			});
			await saveArmy(EVENT, data);
			const armies = await getArmies(REQ);
			assertArmies(armies, [data]);
		});
	});

	describe('Existing', function () {
		it("Should add new units that weren't present before", async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
				],
				equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }],
				pets: [{ hero: 'Barbarian King', petId: requirePet('Lassi', ctx).id }],
			});
			await saveArmy(EVENT, data);
			const army = (await getArmies(REQ))[0];
			// Add units
			army.units.push(
				{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 5 },
				{ home: 'clanCastle', unitId: requireUnit('Archer', ctx).id, amount: 5 }
			);
			army.equipment.push({ equipmentId: requireEquipment('Rage Vial', ctx).id });
			army.pets.push({ hero: 'Archer Queen', petId: requirePet('Spirit Fox', ctx).id });
			await saveArmy(EVENT, army);
			const armySaved = (await getArmies(REQ))[0];
			assertArmies([armySaved], [army]);
		});

		it('Should remove units that are no longer in the army', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'clanCastle', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
					{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 5 },
					{ home: 'clanCastle', unitId: requireUnit('Archer', ctx).id, amount: 5 },
				],
				equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }, { equipmentId: requireEquipment('Rage Vial', ctx).id }],
				pets: [
					{ hero: 'Barbarian King', petId: requirePet('Lassi', ctx).id },
					{ hero: 'Archer Queen', petId: requirePet('Spirit Fox', ctx).id },
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 }],
			});
			await saveArmy(EVENT, data);
			const army = (await getArmies(REQ))[0];
			// Update amount
			army.units[0].amount = 20;
			await saveArmy(EVENT, army);
			const armySaved = (await getArmies(REQ))[0];
			assertArmies([armySaved], [army]);
		});
	});
});

describe('Fetching', function () {
	let ctx: Ctx;

	before(async function () {
		await createDB();
		ctx = await getCtx();
	});

	after(async function () {
		await destroyDB();
	});

	afterEach(async function () {
		await resetDB();
	});

	it('Should not return duplicate entries for JSON fields', async function () {
		const data = makeData({
			name: 'test',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
				{ home: 'armyCamp', unitId: requireUnit('Archer', ctx).id, amount: 10 },
				{ home: 'clanCastle', unitId: requireUnit('Barbarian', ctx).id, amount: 10 },
				{ home: 'clanCastle', unitId: requireUnit('Archer', ctx).id, amount: 10 },
			],
			equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }, { equipmentId: requireEquipment('Rage Vial', ctx).id }],
			pets: [
				{ hero: 'Barbarian King', petId: requirePet('Lassi', ctx).id },
				{ hero: 'Archer Queen', petId: requirePet('Spirit Fox', ctx).id },
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

describe('Validation', function () {
	let ctx: Ctx;

	function testCapacity(type: UnitType, clanCastle: boolean) {
		function _testCapacity(overflow: boolean) {
			const th = requireTh(16, ctx);
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
				{ home, unitId: requireUnit('Barbarian', ctx).id, amount: 1 },
				{ home, unitId: requireUnit('Barbarian', ctx).id, amount: 1 },
			],
		});
		assert.throws(
			function () {
				validateArmy(data, ctx);
			},
			`Duplicate ${clanCastle ? 'clan castle ' : ''}unit "Barbarian" found`
		);
	}

	before(async function () {
		await createDB();
		ctx = await getCtx();
	});

	after(async function () {
		await destroyDB();
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
					{ home: 'armyCamp', unitId: requireUnit('Super Barbarian', ctx).id, amount: 1 },
					{ home: 'armyCamp', unitId: requireUnit('Super Archer', ctx).id, amount: 1 },
					{ home: 'armyCamp', unitId: requireUnit('Super Miner', ctx).id, amount: 1 },
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Super Barbarian', ctx).id, amount: 1 }],
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Lightning', ctx).id, amount: 1 }],
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Wall Wrecker', ctx).id, amount: 1 }],
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
					{ home: 'clanCastle', unitId: requireUnit('Super Barbarian', ctx).id, amount: 1 },
					{ home: 'clanCastle', unitId: requireUnit('Super Archer', ctx).id, amount: 1 },
					{ home: 'clanCastle', unitId: requireUnit('Super Miner', ctx).id, amount: 1 },
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
				units: [{ home: 'clanCastle', unitId: requireUnit('Super Valkyrie', ctx).id, amount: 1 }],
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
				units: [{ home: 'clanCastle', unitId: requireUnit('Battle Drill', ctx).id, amount: 1 }],
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 1 }],
				equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }],
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 1 }],
				equipment: [{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id }, { equipmentId: requireEquipment('Barbarian Puppet', ctx).id }],
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Duplicate equipment "Barbarian Puppet" on barbarian king');
		});

		it('Should not allow hero to have more than two equipments', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 1 }],
				equipment: [
					{ equipmentId: requireEquipment('Barbarian Puppet', ctx).id },
					{ equipmentId: requireEquipment('Rage Vial', ctx).id },
					{ equipmentId: requireEquipment('Earthquake Boots', ctx).id },
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 1 }],
				pets: [
					{ hero: 'Barbarian King', petId: requirePet('Lassi', ctx).id },
					{ hero: 'Barbarian King', petId: requirePet('Spirit Fox', ctx).id },
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
				units: [{ home: 'armyCamp', unitId: requireUnit('Barbarian', ctx).id, amount: 1 }],
				pets: [
					{ hero: 'Barbarian King', petId: requirePet('Mighty Yak', ctx).id },
					{ hero: 'Archer Queen', petId: requirePet('Mighty Yak', ctx).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, ctx);
			}, 'Pet "Mighty Yak" has already been assigned to another hero');
		});
	});
});
