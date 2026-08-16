import { describe, it, beforeEach, beforeAll, afterAll, afterEach } from 'vitest';
import { assert, createReq, USER, USER_2, USER_ADMIN, createUsers, makeData, assertArmies } from '../testutil';
import type { UnitType, StaticGameData } from '$types';
import type { SessionUser } from '$server/auth/session';
import { ArmyModel } from '$models/Army.svelte';
import { UnitModel } from '$models/Unit.svelte';
import { PetModel } from '$models/Pet.svelte';
import { EquipmentModel } from '$models/Equipment.svelte';
import { validateArmy, MAX_PAGE } from '$shared/validation';
import {
	GUIDE_TEXT_CHAR_LIMIT,
	ARMY_TAGS,
	ARMY_TAG_CODES,
	MAX_FILTER_SEARCH_LENGTH,
	MAX_FILTER_UNITS,
	MAX_FILTER_EQUIPMENTS,
	MAX_FILTER_PETS,
} from '$shared/utils';
import { db } from '$server/db';
import { Server } from '$server/api/Server';
import type { RequestEvent } from '@sveltejs/kit';

let gameData: StaticGameData;
let server: Server;

let req: RequestEvent;
let req2: RequestEvent;
let reqAdmin: RequestEvent;

let reqUser: SessionUser;
let req2User: SessionUser;
let _reqAdminUser: SessionUser;

beforeAll(async function () {
	server = new Server(db);
	await server.init();
	gameData = server.gameData.data;

	await createUsers(server);
});

afterAll(async function () {
	await server.dispose();
});

beforeEach(async function () {
	req = createReq(USER, server);
	req2 = createReq(USER_2, server);
	reqAdmin = createReq(USER_ADMIN, server);

	reqUser = req.locals.requireAuth();
	req2User = req2.locals.requireAuth();
	_reqAdminUser = reqAdmin.locals.requireAuth();
});

describe('Saving', function () {
	afterEach(async function () {
		await server.db.deleteFrom('army_units').execute();
		await server.db.deleteFrom('armies').execute();
	});

	describe('New', function () {
		it('Should save army with units', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
				],
			});
			await server.army.saveArmy(req, data);
			const { armies } = await server.army.getArmies(req);
			assertArmies(armies, [data]);
		});

		it('Should save army with units and cc', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
				],
			});
			await server.army.saveArmy(req, data);
			const { armies } = await server.army.getArmies(req);
			assertArmies(armies, [data]);
		});

		it('Should save army with units, cc and equipment', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
				],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id },
				],
			});
			await server.army.saveArmy(req, data);
			const { armies } = await server.army.getArmies(req);
			assertArmies(armies, [data]);
		});

		it('Should save army with units, cc, equipment and pets', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
				],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id },
				],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id },
					{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', gameData).id },
				],
			});
			await server.army.saveArmy(req, data);
			const { armies } = await server.army.getArmies(req);
			assertArmies(armies, [data]);
		});

		it('Should save army with guide', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
				guide: {
					textContent: '<p>Guide!</p>',
					youtubeUrl: null,
				},
			});
			await server.army.saveArmy(req, data);
			const { armies } = await server.army.getArmies(req, { includeGuideContent: true });
			assertArmies(armies, [data]);
		});

		it('Should merge empty guide tags into one', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
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
			await server.army.saveArmy(req, data);
			const { armies } = await server.army.getArmies(req, { includeGuideContent: true });
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
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
				],
				equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id }],
				pets: [{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id }],
			});
			await server.army.saveArmy(req, data);
			const army = (await server.army.getArmies(req)).armies[0];
			// Add units
			army.units.push(
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 5 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 5 }
			);
			army.equipment.push({ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id });
			army.pets.push({ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', gameData).id });
			await server.army.saveArmy(req, army);
			const armySaved = (await server.army.getArmies(req)).armies[0];
			assertArmies([armySaved], [army]);
		});

		it('Should remove units that are no longer in the army', async function () {
			const barbarian = UnitModel.requireTroopByName('Barbarian', gameData);
			const archer = UnitModel.requireTroopByName('Archer', gameData);
			const barbarianPuppet = EquipmentModel.requireByName('Barbarian Puppet', gameData);
			const rageVial = EquipmentModel.requireByName('Rage Vial', gameData);
			const lassi = PetModel.requireByName('Lassi', gameData);
			const spiritFox = PetModel.requireByName('Spirit Fox', gameData);
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: barbarian.id, amount: 10 },
					{ home: 'clanCastle', unitId: barbarian.id, amount: 10 },
					{ home: 'armyCamp', unitId: archer.id, amount: 5 },
					{ home: 'clanCastle', unitId: archer.id, amount: 5 },
				],
				equipment: [{ equipmentId: barbarianPuppet.id }, { equipmentId: rageVial.id }],
				pets: [
					{ hero: 'Barbarian King', petId: lassi.id },
					{ hero: 'Archer Queen', petId: spiritFox.id },
				],
			});
			await server.army.saveArmy(req, data);
			const army = (await server.army.getArmies(req)).armies[0];
			// Remove units
			army.units = army.units.filter((u) => u.unitId !== archer.id);
			army.equipment = army.equipment.filter((eq) => eq.equipmentId !== rageVial.id);
			army.pets = army.pets.filter((p) => p.petId !== spiritFox.id);
			await server.army.saveArmy(req, army);
			const armySaved = (await server.army.getArmies(req)).armies[0];
			assertArmies([armySaved], [army]);
		});

		it('Should remove units if all were removed from the army', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 5 },
				],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id },
				],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id },
					{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', gameData).id },
				],
			});
			await server.army.saveArmy(req, data);
			const army = (await server.army.getArmies(req)).armies[0];
			// Remove all units (you need to keep the army camp units otherwise army can't be saved but that's okay)
			army.units = army.units.filter((u) => u.home === 'armyCamp');
			army.equipment = [];
			army.pets = [];
			await server.army.saveArmy(req, army);
			const armySaved = (await server.army.getArmies(req)).armies[0];
			assertArmies([armySaved], [army]);
		});

		// When you remove and then add again on the UI, you technically are just making a new "blank" unit, so the previous database "id" field is now undefined.
		// However, the system shouldn't care about IDs and still handle this correctly as if you just did nothing.
		// This tests a bug where the system actually just inserted a duplicate unit in the DB since the upsert didn't detect collision with the PK (since id is now undefined)
		it('Should not create duplicate unit db records if unit was removed then re-added', async function () {
			const unit = { id: undefined, home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 };
			const equipment = { id: undefined, equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id };
			const pet = { id: undefined, hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id };
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [unit],
				equipment: [equipment],
				pets: [pet],
			});
			const armyId = await server.army.saveArmy(req, data);

			// Simulate removing and re-adding by ensuring id is undefined (which data above already had, but that was for creating, now we're editing an existing army)
			data.id = armyId;
			await server.army.saveArmy(req, data);

			// Ensure no duplicates were entered into the db
			const unitsCount = await server.db.selectFrom('army_units').selectAll().execute();
			const equipmentCount = await server.db.selectFrom('army_equipment').selectAll().execute();
			const petsCount = await server.db.selectFrom('army_pets').selectAll().execute();
			assert.equal(unitsCount.length, 1);
			assert.equal(equipmentCount.length, 1);
			assert.equal(petsCount.length, 1);
		});

		// This is loosely related to the bug with duplicating unit db records if unit wa removed then re-added.
		// Basically, make sure that if you delete a home unit, and at the same time remove and re-add the same type of
		// unit in the clan castle, that the home unit definitely gets deleted, as there was a bug where it was kept.
		it('should delete home unit if deleted and cc unit removed then re-added at the same time', async function () {
			const barbarian = UnitModel.requireTroopByName('Barbarian', gameData);
			const archer = UnitModel.requireTroopByName('Archer', gameData);
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [
					// Just so we always have one unit in the home camp otherwise you can't save empty army
					{ home: 'armyCamp', unitId: barbarian.id, amount: 1 },
					// Same unit types but one for home camp, and one for clan castle
					{ home: 'armyCamp', unitId: archer.id, amount: 1 },
					{ home: 'clanCastle', unitId: archer.id, amount: 1 },
				],
			});
			await server.army.saveArmy(req, data);

			const army = (await server.army.getArmies(req)).armies[0];
			// Delete home unit from the army
			army.units = army.units.filter((u) => u.home === 'clanCastle' || u.unitId !== archer.id);
			// Simulate removing and re-adding the clan castle unit by ensuring id is undefined
			const ccUnit = army.units.find((u) => u.home === 'clanCastle');
			ccUnit.id = undefined;

			await server.army.saveArmy(req, army);
			const armyAfter = (await server.army.getArmies(req)).armies[0];

			// Assert home unit was deleted
			const homeUnits = armyAfter.units.filter((u) => u.home === 'armyCamp');
			assert.equal(homeUnits.length, 1);
			assert.equal(homeUnits[0].unitId, barbarian.id);
			// This shouldn't have changed
			const ccUnits = armyAfter.units.filter((u) => u.home === 'clanCastle');
			assert.equal(ccUnits.length, 1);
		});

		it('Should save different unit amount', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			});
			await server.army.saveArmy(req, data);
			const army = (await server.army.getArmies(req)).armies[0];
			// Update amount
			army.units[0].amount = 20;
			await server.army.saveArmy(req, army);
			const armySaved = (await server.army.getArmies(req)).armies[0];
			assertArmies([armySaved], [army]);
		});

		it('Should remove guide if it was removed', async function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
				guide: {
					textContent: '<p>Guide!</p>',
					youtubeUrl: null,
				},
			});
			await server.army.saveArmy(req, data);
			const army = (await server.army.getArmies(req, { includeGuideContent: true })).armies[0];
			// Remove guide
			army.guide = null;
			army.hasGuide = false;
			await server.army.saveArmy(req, army);
			const armySaved = (await server.army.getArmies(req, { includeGuideContent: true })).armies[0];
			assertArmies([armySaved], [army]);
		});
	});
});

describe('Fetching', function () {
	afterEach(async function () {
		await server.db.deleteFrom('army_units').execute();
		await server.db.deleteFrom('armies').execute();
	});

	it('Should not return duplicate entries for JSON fields', async function () {
		const data = makeData({
			name: 'test',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 },
			],
			equipment: [
				{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
				{ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id },
			],
			pets: [
				{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id },
				{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', gameData).id },
			],
		});
		const data2 = { ...data, name: 'test2' };
		// Create two armies
		await server.army.saveArmy(req, data);
		await server.army.saveArmy(req, data2);
		// Assert  units/equipment/pets length matches for each army (assertArmies handles this)
		const { armies } = await server.army.getArmies(req);
		assertArmies(armies, [data, data2]);
	});

	it('Should filter armies by unit', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const data1 = makeData({
			name: 'with-barbarian',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }],
		});
		const data2 = makeData({
			name: 'with-archer',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { units: [barbarianId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by multiple units, matching only armies with all of them', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const archerId = UnitModel.requireTroopByName('Archer', gameData).id;
		const data1 = makeData({
			name: 'with-both',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: barbarianId, amount: 10 },
				{ home: 'armyCamp', unitId: archerId, amount: 10 },
			],
		});
		const data2 = makeData({
			name: 'with-barbarian-only',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { units: [barbarianId, archerId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by spell', async function () {
		const healingId = UnitModel.requireSpellByName('Healing', gameData).id;
		const data1 = makeData({
			name: 'with-heal',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
				{ home: 'armyCamp', unitId: healingId, amount: 1 },
			],
		});
		const data2 = makeData({
			name: 'without-heal',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { units: [healingId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by equipment', async function () {
		const barbarianPuppetId = EquipmentModel.requireByName('Barbarian Puppet', gameData).id;
		const data1 = makeData({
			name: 'with-puppet',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: barbarianPuppetId }],
		});
		const data2 = makeData({
			name: 'with-vial',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { equipments: [barbarianPuppetId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by multiple equipment, matching only armies with all of them', async function () {
		const barbarianPuppetId = EquipmentModel.requireByName('Barbarian Puppet', gameData).id;
		const giantGauntletId = EquipmentModel.requireByName('Giant Gauntlet', gameData).id;
		const data1 = makeData({
			name: 'with-both-equipment',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: barbarianPuppetId }, { equipmentId: giantGauntletId }],
		});
		const data2 = makeData({
			name: 'with-puppet-only',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: barbarianPuppetId }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { equipments: [barbarianPuppetId, giantGauntletId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by pet', async function () {
		const lassiId = PetModel.requireByName('Lassi', gameData).id;
		const data1 = makeData({
			name: 'with-lassi',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			pets: [{ hero: 'Barbarian King', petId: lassiId }],
		});
		const data2 = makeData({
			name: 'with-fox',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			pets: [{ hero: 'Archer Queen', petId: PetModel.requireByName('Spirit Fox', gameData).id }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { pets: [lassiId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by multiple pets, matching only armies with all of them', async function () {
		const lassiId = PetModel.requireByName('Lassi', gameData).id;
		const spiritFoxId = PetModel.requireByName('Spirit Fox', gameData).id;
		const data1 = makeData({
			name: 'with-both-pets',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			pets: [
				{ hero: 'Barbarian King', petId: lassiId },
				{ hero: 'Archer Queen', petId: spiritFoxId },
			],
		});
		const data2 = makeData({
			name: 'with-lassi-only',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			pets: [{ hero: 'Barbarian King', petId: lassiId }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { pets: [lassiId, spiritFoxId] });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by hero', async function () {
		const data1 = makeData({
			name: 'with-bk-equipment',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id }],
		});
		const data2 = makeData({
			name: 'with-bk-pet',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			pets: [{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id }],
		});
		const data3 = makeData({
			name: 'with-aq-only',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: EquipmentModel.requireByName('Healer Puppet', gameData).id }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);
		await server.army.saveArmy(req, data3);

		// Barbarian King filter should match armies with BK equipment or BK pets
		const { armies } = await server.army.getArmies(req, { hero: 'Barbarian King' });
		assertArmies(armies, [data1, data2]);
	});

	it('Should return empty when no armies match filter', async function () {
		const archerId = UnitModel.requireTroopByName('Archer', gameData).id;
		const data = makeData({
			name: 'no-match',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data);

		const { armies } = await server.army.getArmies(req, { units: [archerId] });
		assertArmies(armies, []);
	});

	it('Should not match units in clan castle when filtering by unit', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const archerId = UnitModel.requireTroopByName('Archer', gameData).id;
		const data = makeData({
			name: 'cc-only',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: barbarianId, amount: 10 },
				{ home: 'clanCastle', unitId: archerId, amount: 5 },
			],
		});
		await server.army.saveArmy(req, data);

		// Should not match Archer since it's only in clan castle
		const { armies } = await server.army.getArmies(req, { units: [archerId] });
		assertArmies(armies, []);

		// Should match Barbarian since it's in army camp
		const { armies: armies2 } = await server.army.getArmies(req, { units: [barbarianId] });
		assertArmies(armies2, [data]);
	});

	it('Should filter armies by search term (case-insensitive + partially match)', async function () {
		const data1 = makeData({
			name: 'Fast Dragon Rush',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		const data2 = makeData({
			name: 'Fast Barbarian Rush',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { search: 'dragon' });
		assertArmies(armies, [data1]);
	});

	it('Should filter armies by attack type', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const balloonId = UnitModel.requireTroopByName('Balloon', gameData).id;
		const dataAir = makeData({
			name: 'all-air',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: balloonId, amount: 10 }],
		});
		const dataGround = makeData({
			name: 'all-ground',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }],
		});
		const dataHybrid = makeData({
			name: 'half-air-half-ground',
			townHall: 16,
			// 50% air/ground:
			// - Balloon housing space 5 * 1
			// - Barbarian housing space 1 * 5
			units: [
				{ home: 'armyCamp', unitId: balloonId, amount: 1 },
				{ home: 'armyCamp', unitId: barbarianId, amount: 5 },
			],
		});
		await server.army.saveArmy(req, dataAir);
		await server.army.saveArmy(req, dataGround);
		await server.army.saveArmy(req, dataHybrid);

		const { armies: airArmies } = await server.army.getArmies(req, { attackType: 'Air' });
		assertArmies(airArmies, [dataAir]);

		const { armies: groundArmies } = await server.army.getArmies(req, { attackType: 'Ground' });
		assertArmies(groundArmies, [dataGround]);

		const { armies: hybridArmies } = await server.army.getArmies(req, { attackType: 'Hybrid' });
		assertArmies(hybridArmies, [dataHybrid]);
	});

	it('Should filter armies that have a guide', async function () {
		const dataWithGuide = makeData({
			name: 'with-guide',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			guide: { textContent: '<p>Guide!</p>', youtubeUrl: null },
		});
		const dataWithoutGuide = makeData({
			name: 'without-guide',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, dataWithGuide);
		await server.army.saveArmy(req, dataWithoutGuide);

		const { armies } = await server.army.getArmies(req, { hasGuide: true, includeGuideContent: true });
		assertArmies(armies, [dataWithGuide]);
	});

	it('Should filter out armies with super troops', async function () {
		const data1 = makeData({
			name: 'with-super-troop',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Barbarian', gameData).id, amount: 1 }],
		});
		const data2 = makeData({
			name: 'without-super-troop',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { noSuperTroops: true });
		assertArmies(armies, [data2]);
	});

	it('Should filter out armies with epic equipment', async function () {
		const data1 = makeData({
			name: 'with-epic-equipment',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: EquipmentModel.requireByName('Giant Gauntlet', gameData).id }],
		});
		const data2 = makeData({
			name: 'without-epic-equipment',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { noEpicEquipment: true });
		assertArmies(armies, [data2]);
	});

	it('Should filter armies with/without clan castle', async function () {
		const data1 = makeData({
			name: 'with-cc',
			townHall: 16,
			units: [
				{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 },
				{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Archer', gameData).id, amount: 5 },
			],
		});
		const data2 = makeData({
			name: 'without-cc',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies: withCC } = await server.army.getArmies(req, { hasClanCastle: true });
		assertArmies(withCC, [data1]);

		const { armies: withoutCC } = await server.army.getArmies(req, { hasClanCastle: false });
		assertArmies(withoutCC, [data2]);
	});

	it('Should filter armies with/without equipment', async function () {
		const data1 = makeData({
			name: 'with-equipment',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id }],
		});
		const data2 = makeData({
			name: 'without-equipment',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies: withEquipment } = await server.army.getArmies(req, { hasEquipment: true });
		assertArmies(withEquipment, [data1]);

		const { armies: withoutEquipment } = await server.army.getArmies(req, { hasEquipment: false });
		assertArmies(withoutEquipment, [data2]);
	});

	it('Should filter armies with/without pets', async function () {
		const data1 = makeData({
			name: 'with-pet',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			pets: [{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id }],
		});
		const data2 = makeData({
			name: 'without-pet',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies: withPets } = await server.army.getArmies(req, { hasPets: true });
		assertArmies(withPets, [data1]);

		const { armies: withoutPets } = await server.army.getArmies(req, { hasPets: false });
		assertArmies(withoutPets, [data2]);
	});

	it('Should filter armies by multiple tags, matching only armies with all of them', async function () {
		const [tag1, tag2] = ARMY_TAGS;
		const data1 = makeData({
			name: 'with-both-tags',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			tags: [tag1, tag2],
		});
		const data2 = makeData({
			name: 'with-one-tag',
			townHall: 16,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
			tags: [tag1],
		});
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);

		const { armies } = await server.army.getArmies(req, { tags: [tag1, tag2] });
		assertArmies(armies, [data1]);
	});

	it('Should return the total count of matching armies even when not paginating', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const data1 = makeData({ name: 'total-1', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] });
		const data2 = makeData({ name: 'total-2', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] });
		const data3 = makeData({ name: 'total-3', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] });
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);
		await server.army.saveArmy(req, data3);

		const { armies, total } = await server.army.getArmies(req);
		assert.lengthOf(armies, 3);
		assert.equal(total, 3);
	});

	it('Should paginate armies using page/limit', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const names = ['paginated-1', 'paginated-2', 'paginated-3', 'paginated-4', 'paginated-5'];
		for (const name of names) {
			await server.army.saveArmy(req, makeData({ name, townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] }));
		}

		const { armies: page1, total: total1 } = await server.army.getArmies(req, { limit: 2, page: 1 });
		const { armies: page2, total: total2 } = await server.army.getArmies(req, { limit: 2, page: 2 });
		const { armies: page3, total: total3 } = await server.army.getArmies(req, { limit: 2, page: 3 });

		assert.lengthOf(page1, 2);
		assert.lengthOf(page2, 2);
		assert.lengthOf(page3, 1);
		assert.equal(total1, 5);
		assert.equal(total2, 5);
		assert.equal(total3, 5);
		assert.deepEqual(page1.map((a) => a.name).toSorted(), [names[0], names[1]]);
		assert.deepEqual(page2.map((a) => a.name).toSorted(), [names[2], names[3]]);
		assert.deepEqual(page3.map((a) => a.name).toSorted(), [names[4]]);
	});

	it('Should default to page 1 when limit is set without a page', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		await server.army.saveArmy(req, makeData({ name: 'page-default-1', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] }));
		await server.army.saveArmy(req, makeData({ name: 'page-default-2', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] }));

		const { armies: withoutPage } = await server.army.getArmies(req, { limit: 1 });
		const { armies: withPage1 } = await server.army.getArmies(req, { limit: 1, page: 1 });

		assert.lengthOf(withoutPage, 1);
		assert.equal(withoutPage[0].name, withPage1[0].name);
	});

	it('Should base total on the filtered result count, not all armies', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const data1 = makeData({ name: 'th16-a', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] });
		const data2 = makeData({ name: 'th16-b', townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] });
		const data3 = makeData({ name: 'th10-a', townHall: 10, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] });
		await server.army.saveArmy(req, data1);
		await server.army.saveArmy(req, data2);
		await server.army.saveArmy(req, data3);

		const { armies, total } = await server.army.getArmies(req, { townHall: 16, limit: 1, page: 1 });
		assert.lengthOf(armies, 1);
		assert.equal(total, 2);
	});

	it('Should still report the total when the requested page is out of range', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		for (const name of ['oor-1', 'oor-2', 'oor-3']) {
			await server.army.saveArmy(req, makeData({ name, townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] }));
		}

		const { armies, total } = await server.army.getArmies(req, { limit: 2, page: 50 });
		assert.lengthOf(armies, 0);
		assert.equal(total, 3);
	});

	it('Should treat a page beyond the max as out of range, not as page one', async function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		for (const name of ['cap-1', 'cap-2', 'cap-3']) {
			await server.army.saveArmy(req, makeData({ name, townHall: 16, units: [{ home: 'armyCamp', unitId: barbarianId, amount: 10 }] }));
		}

		const query = server.army.parseArmyListQuery(new URLSearchParams(`page=${MAX_PAGE + 500}`));
		const { armies, total } = await server.army.getArmies(req, { ...query, limit: 2 });

		// Silently serving page 1 here would leave the UI claiming a page number it isn't showing
		assert.lengthOf(armies, 0);
		assert.equal(total, 3);
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
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		const data2 = makeData({
			name: 'test2',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		armyId = await server.army.saveArmy(req, data);
		armyId2 = await server.army.saveArmy(req, data2);
	});

	afterAll(async function () {
		await server.db.deleteFrom('army_units').execute();
		await server.db.deleteFrom('armies').execute();
	});

	afterEach(async function () {
		await server.db.deleteFrom('army_comments').execute();
	});

	it('Should be able to create a comment', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await server.army.saveComment(req, data);
		const comment = await server.db.selectFrom('army_comments').where('id', '=', id).selectAll().executeTakeFirstOrThrow();
		assert.include(comment, {
			armyId,
			comment: 'Test comment',
			replyTo: null,
			createdBy: reqUser.id,
		});
	});

	it('Should be able to edit existing comment text', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await server.army.saveComment(req, data);
		const newData = { ...data, id, comment: 'Test comment updated' };
		await server.army.saveComment(req, newData);
		const comment = await server.db.selectFrom('army_comments').where('id', '=', id).selectAll().executeTakeFirstOrThrow();
		assert.include(comment, {
			armyId,
			comment: 'Test comment updated',
			replyTo: null,
			createdBy: reqUser.id,
		});
	});

	it('Should throw if armyId or replyTo for comment changed', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await server.army.saveComment(req, data);

		// Ensure changing armyId throws
		await assert.throwsAsync(async function () {
			const newData = { ...data, id, armyId: armyId2 };
			await server.army.saveComment(req, newData);
		}, 'Moving comments is not allowed');

		// Ensure changing replyTo throws
		await assert.throwsAsync(async function () {
			const newData = { ...data, id, replyTo: 1 };
			await server.army.saveComment(req, newData);
		}, 'Moving comments is not allowed');
	});

	it('Should be able to reply to other comments', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await server.army.saveComment(req, data);
		const replyingData = {
			armyId,
			comment: 'Replying',
			replyTo: id,
		};
		const replyId = await server.army.saveComment(req, replyingData);
		const comment = await server.db.selectFrom('army_comments').where('id', '=', replyId).selectAll().executeTakeFirstOrThrow();
		assert.include(comment, {
			armyId,
			comment: 'Replying',
			replyTo: id,
			createdBy: reqUser.id,
		});
	});

	it('Should not be able to edit other peoples comments (unless admin)', async function () {
		const data = {
			armyId,
			comment: 'Test comment',
			replyTo: null,
		};
		const id = await server.army.saveComment(req, data);

		try {
			// Saving this comment with another non-admin user should throw
			await server.army.saveComment(req2, { ...data, id, comment: 'Updated ' });
			assert.fail('Expected error');
		} catch (err: any) {
			assert.equal(err.body.message, "You don't have permission to do this warrior!");
			// Assert comment was not changed
			const comment = await server.db.selectFrom('army_comments').where('id', '=', id).selectAll().executeTakeFirstOrThrow();
			assert.include(comment, { ...data, createdBy: reqUser.id });
		}

		// Admin should be able to save any comment
		await server.army.saveComment(reqAdmin, { ...data, id, comment: 'Updated ' });
		const comment = await server.db.selectFrom('army_comments').where('id', '=', id).selectAll().executeTakeFirstOrThrow();
		assert.include(comment, { ...data, createdBy: reqUser.id, comment: 'Updated' });
	});
});

describe('Army votes', function () {
	let armyId: number;
	let armyId2: number;

	beforeAll(async function () {
		// Create test armies for saving votes
		const data = makeData({
			name: 'test',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		const data2 = makeData({
			name: 'test2',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		armyId = await server.army.saveArmy(req, data);
		armyId2 = await server.army.saveArmy(req, data2);
	});

	afterAll(async function () {
		await server.db.deleteFrom('army_units').execute();
		await server.db.deleteFrom('armies').execute();
	});

	afterEach(async function () {
		await server.db.deleteFrom('army_votes').execute();
	});

	it('Should be able to up/down vote an army', async function () {
		await server.army.saveVote(req, { armyId, vote: 1 });
		const upvote = await server.db.selectFrom('army_votes').where('armyId', '=', armyId).selectAll().executeTakeFirstOrThrow();
		assert.include(upvote, { armyId, votedBy: reqUser.id, vote: 1 });

		await server.army.saveVote(req, { armyId, vote: -1 });
		const downvote = await server.db.selectFrom('army_votes').where('armyId', '=', armyId).selectAll().executeTakeFirstOrThrow();
		assert.include(downvote, { armyId, votedBy: reqUser.id, vote: -1 });
	});

	it('Should only clear the vote for the given army', async function () {
		await server.army.saveVote(req, { armyId, vote: 1 });
		await server.army.saveVote(req, { armyId: armyId2, vote: 1 });

		await server.army.saveVote(req, { armyId, vote: 0 });

		const votes = await server.db.selectFrom('army_votes').where('votedBy', '=', reqUser.id).selectAll().execute();
		assert.lengthOf(votes, 1);
		assert.include(votes[0], { armyId: armyId2, votedBy: reqUser.id, vote: 1 });
	});

	it("Should not clear other users' votes for the same army", async function () {
		await server.army.saveVote(req, { armyId, vote: 1 });
		await server.army.saveVote(req2, { armyId, vote: 1 });

		await server.army.saveVote(req, { armyId, vote: 0 });

		const votes = await server.db.selectFrom('army_votes').where('armyId', '=', armyId).selectAll().execute();
		assert.lengthOf(votes, 1);
		assert.include(votes[0], { armyId, votedBy: req2User.id, vote: 1 });
	});

	it('Should throw for an invalid vote', async function () {
		await assert.throwsAsync(() => server.army.saveVote(req, { armyId, vote: 2 }), 'Invalid vote');
	});
});

describe('Army notifications', function () {
	let armyId: number;

	beforeAll(async function () {
		const data = makeData({
			name: 'test',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		armyId = await server.army.saveArmy(req, data);
	});

	afterAll(async function () {
		await server.db.deleteFrom('army_units').execute();
		await server.db.deleteFrom('armies').execute();
	});

	afterEach(async function () {
		await server.db.deleteFrom('army_comments').execute();
		await server.db.deleteFrom('army_notifications').execute();
	});

	describe('Comment', function () {
		it('should notify army creator if someone comments', async function () {
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await server.army.saveComment(req2, data);
			const notifications = await server.notification.getNotifications(req, { userId: reqUser.id });
			assert.lengthOf(notifications, 1);
			assert.include(notifications[0], { armyId, commentId, type: 'comment', recipientId: reqUser.id, triggeringUserId: req2User.id });
		});

		it('should not notify army creator if they comment on their own army', async function () {
			const data = { armyId, comment: 'Comment...', replyTo: null };
			await server.army.saveComment(req, data);
			const notifications = await server.notification.getNotifications(req, { userId: reqUser.id });
			assert.lengthOf(notifications, 0);
		});
	});

	describe('Comment reply', function () {
		it('should notify commenter if someone replies', async function () {
			// Comment on own army (should not notify)
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await server.army.saveComment(req, data);

			// Another user replies (should notify, but with type "comment-reply")
			const data2 = { armyId, comment: 'Comment reply...', replyTo: commentId };
			const commentId2 = await server.army.saveComment(req2, data2);

			const notifications = await server.notification.getNotifications(req, { userId: reqUser.id });
			assert.lengthOf(notifications, 1);
			assert.include(notifications[0], { armyId, commentId: commentId2, type: 'comment-reply', recipientId: reqUser.id, triggeringUserId: req2User.id });
		});

		it('should not notify commenter if they reply to themselves', async function () {
			// Comment on user army
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await server.army.saveComment(req2, data);

			// Reply to self
			const data2 = { armyId, comment: 'Comment reply...', replyTo: commentId };
			await server.army.saveComment(req2, data2);

			// Should be 2 notifications, but only to the army creator of 2 new comments
			const notifications = await server.notification.getNotifications(req, { userId: reqUser.id });
			assert.lengthOf(notifications, 2);
			assert.include(notifications[0], { armyId, type: 'comment', recipientId: reqUser.id, triggeringUserId: req2User.id });
			assert.include(notifications[1], { armyId, type: 'comment', recipientId: reqUser.id, triggeringUserId: req2User.id });
		});

		it('should not notify army creator if they reply to someone else', async function () {
			// Comment on user army
			const data = { armyId, comment: 'Comment...', replyTo: null };
			const commentId = await server.army.saveComment(req2, data);

			// Reply to comment as the army creator
			const data2 = { armyId, comment: 'Comment reply...', replyTo: commentId };
			await server.army.saveComment(req, data2);

			// Should be 2 notifications, one to the creator that someone commented, and another to the commenter as the creator replied
			const notificationsCreator = await server.notification.getNotifications(req, { userId: reqUser.id });
			assert.lengthOf(notificationsCreator, 1);
			assert.include(notificationsCreator[0], { armyId, type: 'comment', recipientId: reqUser.id, triggeringUserId: req2User.id });

			const notificationsCommenter = await server.notification.getNotifications(req2, { userId: req2User.id });
			assert.lengthOf(notificationsCommenter, 1);
			assert.include(notificationsCommenter[0], { armyId, type: 'comment-reply', recipientId: req2User.id, triggeringUserId: reqUser.id });
		});
	});

	describe('Acknowledgement', function () {
		it("should not allow user to acknowledge other users' notifications, unless admin", async function () {
			// Comment on user army
			const data = { armyId, comment: 'Comment...', replyTo: null };
			await server.army.saveComment(req2, data);
			const notificationId = (await server.notification.getNotifications(req, { userId: reqUser.id }))[0]?.id;

			await assert.throwsAsync(async () => {
				// Acknowledging the notification with a different non-admin user should throw
				await server.notification.acknowledge(req2, [notificationId]);
			}, "Cannot acknowledge notifications that aren't yours");

			// Should not have changed if the notification has been acknowledged
			assert.strictEqual((await server.notification.getNotifications(req, { userId: reqUser.id }))[0]?.seen, null);

			// Admin should be able to acknowledge
			await server.notification.acknowledge(reqAdmin, [notificationId]);
			assert.instanceOf((await server.notification.getNotifications(req, { userId: reqUser.id }))[0]?.seen, Date);
		});
	});
});

describe('Validation', function () {
	function testCapacity(type: UnitType, clanCastle: boolean) {
		function _testCapacity(overflow: boolean) {
			const th = ArmyModel.requireTownHall(16, gameData);
			const longType = type === 'Siege' ? 'siege machine' : type.toLowerCase();
			const maxCapacity = clanCastle ? th[`cc${type}Capacity`] : th[`${type.toLowerCase()}Capacity`];
			const data = makeData({
				name: 'test',
				townHall: th.level,
				units: [
					{ home: clanCastle ? 'clanCastle' : 'armyCamp', unitId: gameData.units.find((u) => u.type === type)?.id, amount: maxCapacity + (overflow ? 1 : 0) },
				],
			});
			if (overflow) {
				const msg = `Town hall ${th.level} has a max ${clanCastle ? 'clan castle ' : ''}${longType} capacity of ${maxCapacity}, but this army exceeded that with ${maxCapacity + 1}`;
				assert.throws(function () {
					validateArmy(data, gameData);
				}, msg);
			} else {
				// Should not throw
				validateArmy(data, gameData);
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
				{ home, unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 },
				{ home, unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 },
			],
		});
		assert.throws(
			function () {
				validateArmy(data, gameData);
			},
			`Duplicate ${clanCastle ? 'clan castle ' : ''}unit "Barbarian" found`
		);
	}

	it('Should not allow more than 4 heroes', function () {
		// The amount of heroes used by an army is defined by what equipment/pets are used
		const data = makeData({
			name: 'test',
			townHall: 6,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 }],
			equipment: [
				// Barbarian King equipment
				{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
				// Archer Queen equipment
				{ equipmentId: EquipmentModel.requireByName('Archer Puppet', gameData).id },
				// Royal Champion equipment
				{ equipmentId: EquipmentModel.requireByName('Rocket Spear', gameData).id },
				// Grand Warden equipment
				{ equipmentId: EquipmentModel.requireByName('Eternal Tome', gameData).id },
			],
			pets: [
				// Minion Prince
				{ hero: 'Minion Prince', petId: PetModel.requireByName('Lassi', gameData).id },
			],
		});
		assert.throws(function () {
			validateArmy(data, gameData);
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
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Barbarian', gameData).id, amount: 1 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Archer', gameData).id, amount: 1 },
					{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Miner', gameData).id, amount: 1 },
				],
			});
			// Should throw with 3 unique super troops
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'An army can have a maximum of two unique super troops');
			// Should not throw now with 2 unique super troops
			data.units?.splice(0, 1);
			validateArmy(data, gameData);
		});

		it('Should not allow super troops before town hall 11', function () {
			const data = makeData({
				name: 'test',
				townHall: 10,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Super Barbarian', gameData).id, amount: 1 }],
			});
			// Should throw at town hall 10
			assert.throws(function () {
				validateArmy(data, gameData);
			}, `Unit "Super Barbarian" isn't available at town hall 10`);
			// Should not throw at town hall 11
			data.townHall = 11;
			validateArmy(data, gameData);
		});

		it('Should not allow spells before town hall 5', function () {
			const data = makeData({
				name: 'test',
				townHall: 4,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireSpellByName('Lightning', gameData).id, amount: 1 }],
			});
			// Should throw at town hall 4
			assert.throws(function () {
				validateArmy(data, gameData);
			}, `Town hall 4 has a max spell capacity of 0, but this army exceeded that with 1`);
			// Should not throw at town hall 5
			data.townHall = 5;
			validateArmy(data, gameData);
		});

		it('Should not allow siege machines before town hall 12', function () {
			const data = makeData({
				name: 'test',
				townHall: 11,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Wall Wrecker', gameData).id, amount: 1 }],
			});
			// Should throw at town hall 11
			assert.throws(function () {
				validateArmy(data, gameData);
			}, `Town hall 11 has a max siege machine capacity of 0, but this army exceeded that with 1`);
			// Should not throw at town hall 12
			data.townHall = 12;
			validateArmy(data, gameData);
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
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Barbarian', gameData).id, amount: 1 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Archer', gameData).id, amount: 1 },
					{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Miner', gameData).id, amount: 1 },
				],
			});
			// Should not throw even with more than 2 unique super troops
			validateArmy(data, gameData);
		});

		it('Should only allow super troop if the regular troop version is at a high enough level to be boosted', function () {
			// Super valkyrie must be level 7 to be boosted (which requires lab level 10)
			const thLabLvl9 = gameData.townHalls.find((th) => th.maxLaboratory === 9);
			const thLabLvl10 = gameData.townHalls.find((th) => th.maxLaboratory === 10);
			if (!thLabLvl9 || !thLabLvl10) {
				throw new Error('Expected town hall data');
			}
			const data = makeData({
				name: 'test',
				townHall: thLabLvl9.level,
				units: [{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Super Valkyrie', gameData).id, amount: 1 }],
			});
			// Should throw when lab is level 9
			assert.throws(function () {
				validateArmy(data, gameData);
			}, `Clan castle unit "Super Valkyrie" isn't available at town hall ${thLabLvl9.level}`);
			// Should not throw when lab is level 10
			data.townHall = thLabLvl10.level;
			validateArmy(data, gameData);
		});

		it('Should only allow battle drill once clan castle level 9 is unlocked', function () {
			const thCcLvl8 = gameData.townHalls.find((th) => th.maxCc === 8);
			const thCcLvl9 = gameData.townHalls.find((th) => th.maxCc === 9);
			if (!thCcLvl8 || !thCcLvl9) {
				throw new Error('Expected town hall data');
			}
			const data = makeData({
				name: 'test',
				townHall: thCcLvl8.level,
				units: [{ home: 'clanCastle', unitId: UnitModel.requireTroopByName('Battle Drill', gameData).id, amount: 1 }],
			});
			// Should throw when clan castle is level 8
			assert.throws(function () {
				validateArmy(data, gameData);
			}, `Clan castle unit "Battle Drill" isn't available at town hall ${thCcLvl8.level}`);
			// Should not throw when clan castle is level 9
			data.townHall = thCcLvl9.level;
			validateArmy(data, gameData);
		});
	});

	describe('Equipment', function () {
		it("Should not allow equipment for a hero that isn't unlocked yet", function () {
			const data = makeData({
				name: 'test',
				townHall: 3,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 }],
				equipment: [{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id }],
			});
			// Should throw at town hall level 6 as king isn't unlocked yet
			assert.throws(function () {
				validateArmy(data, gameData);
			}, `Equipment "Barbarian Puppet" can't be used as the barbarian king isn't unlocked at town hall 3`);
			// Should not throw at town hall 7 as king is unlocked
			data.townHall = 7;
			validateArmy(data, gameData);
		});

		it('Should not allow hero to have duplicate equipment', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 }],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Duplicate equipment "Barbarian Puppet" on barbarian king');
		});

		it('Should not allow hero to have more than two equipments', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 }],
				equipment: [
					{ equipmentId: EquipmentModel.requireByName('Barbarian Puppet', gameData).id },
					{ equipmentId: EquipmentModel.requireByName('Rage Vial', gameData).id },
					{ equipmentId: EquipmentModel.requireByName('Earthquake Boots', gameData).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Hero barbarian king cannot have more than two pieces of equipment');
		});
	});

	describe('Pets', async function () {
		it('Should not allow a hero to have multiple pets', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 }],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Lassi', gameData).id },
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Spirit Fox', gameData).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Hero barbarian king cannot have more than one pet');
		});

		it('Should not allow the same pet on multiple heroes', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 1 }],
				pets: [
					{ hero: 'Barbarian King', petId: PetModel.requireByName('Mighty Yak', gameData).id },
					{ hero: 'Archer Queen', petId: PetModel.requireByName('Mighty Yak', gameData).id },
				],
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Pet "Mighty Yak" has already been assigned to another hero');
		});
	});

	describe('Guide', function () {
		it('Should make sure there is either text content or a youtube URL', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
				guide: {
					textContent: null,
					youtubeUrl: null,
				},
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Guide must have at least either text content or YouTube video URL');
		});

		it('Should not allow invalid youtube URLs', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
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
				'https://m.youtube.com/watch?v=ZxWrWMDJS8Q', // Mobile
				'https://www.youtube.com/shorts/n0BHlqkWQG4', // Shorts
				'https://m.youtube.com/shorts/n0BHlqkWQG4', // Shorts mobile
				'https://youtu.be/ZxWrWMDJS8Q?si=sbyI3Z8vJXqi0P_n&t=869', // Short URL with share & time params
			];
			for (const invalid of invalidURLs) {
				data.guide.youtubeUrl = invalid;
				assert.throws(function () {
					validateArmy(data, gameData);
				}, 'Guide has an invalid YouTube URL');
			}
			for (const valid of validURLs) {
				// Should not throw as now the youtube URL is valid
				data.guide.youtubeUrl = valid;
				validateArmy(data, gameData);
			}
		});

		it('Should not allow empty text content', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
				guide: {
					textContent: '',
					youtubeUrl: null,
				},
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Guide must have at least either text content or YouTube video URL');
		});

		it('Should not allow text content to go over the max char limit', function () {
			const data = makeData({
				name: 'test',
				townHall: 16,
				units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 10 }],
				guide: {
					textContent: `<p>${'a'.repeat(GUIDE_TEXT_CHAR_LIMIT + 1)}</p>`,
					youtubeUrl: null,
				},
			});
			assert.throws(function () {
				validateArmy(data, gameData);
			}, 'Guide text content exceeded the character limit');
			// Should not fail now as within limit
			data.guide.textContent = `<p>${'a'.repeat(GUIDE_TEXT_CHAR_LIMIT)}</p>`;
			validateArmy(data, gameData);
		});
	});
});

describe('Army model', function () {
	describe('getStats()', function () {
		it('should correctly report if we have a clan castle', function () {
			const model = new ArmyModel(gameData);

			// Should be false for empty army
			assert.equal(model.getStats().hasClanCastle, false);

			// Add non-cc troop, should still be false
			const unit = UnitModel.requireTroopByName('Barbarian', gameData);
			model.addUnit(unit, 'armyCamp');
			assert.equal(model.getStats().hasClanCastle, false);

			// Add cc troop, should now be true
			const ccUnit = UnitModel.requireTroopByName('Barbarian', gameData);
			model.addUnit(ccUnit, 'clanCastle');
			assert.equal(model.getStats().hasClanCastle, true);
		});

		it('should correctly report if we have heroes', function () {
			const model = new ArmyModel(gameData);

			// Should be false for empty army
			assert.equal(model.getStats().hasHeroes, false);

			// Should be true if hero is added (note heroes are ephemeral, so we have one if any equipment/pets for that hero are present)
			const equipment = EquipmentModel.requireByName('Eternal Tome', gameData);
			model.addEquipment(equipment);
			assert.equal(model.getStats().hasHeroes, true);
		});

		it('should correctly report if we have a guide', function () {
			const model = new ArmyModel(gameData);

			// Should be false for empty army
			assert.equal(model.getStats().hasGuide, false);

			// Should be true if we make a guide
			model.addGuide();
			assert.equal(model.getStats().hasGuide, true);
		});

		it('should correctly report the type of army', function () {
			const model = new ArmyModel(gameData);

			// Empty army technically will never exist, there will always be some units (in practice) so no
			// point even testing what it chooses, but we can test it at least doesn't error because why not
			model.getStats();

			// Should be hybrid if equal ground+air units with same housing space
			model.addUnit(UnitModel.requireTroopByName('Giant', gameData), 'armyCamp');
			model.addUnit(UnitModel.requireTroopByName('Balloon', gameData), 'armyCamp');
			assert.equal(model.getStats().type, 'Hybrid');
			model.remove('Giant', 'armyCamp');
			model.remove('Balloon', 'armyCamp');

			// Should be air if equal ground+air units but air has higher housing space
			model.addUnit(UnitModel.requireTroopByName('Giant', gameData), 'armyCamp');
			model.addUnit(UnitModel.requireTroopByName('Baby Dragon', gameData), 'armyCamp');
			assert.equal(model.getStats().type, 'Air');
			model.remove('Giant', 'armyCamp');
			model.remove('Baby Dragon', 'armyCamp');

			// Should be ground if equal ground+air units but ground has higher housing space
			model.addUnit(UnitModel.requireTroopByName('Golem', gameData), 'armyCamp');
			model.addUnit(UnitModel.requireTroopByName('Balloon', gameData), 'armyCamp');
			assert.equal(model.getStats().type, 'Ground');
			model.remove('Golem', 'armyCamp');
			model.remove('Balloon', 'armyCamp');

			// Should be ground if more ground units but same housing space as air units
			model.addUnit(UnitModel.requireTroopByName('Giant', gameData), 'armyCamp', 2);
			model.addUnit(UnitModel.requireTroopByName('Balloon', gameData), 'armyCamp', 1);
			assert.equal(model.getStats().type, 'Ground');
			model.remove('Giant', 'armyCamp');
			model.remove('Balloon', 'armyCamp');

			// Should be air if more air units but same housing space as ground units
			model.addUnit(UnitModel.requireTroopByName('Giant', gameData), 'armyCamp', 1);
			model.addUnit(UnitModel.requireTroopByName('Balloon', gameData), 'armyCamp', 2);
			assert.equal(model.getStats().type, 'Air');
			model.remove('Giant', 'armyCamp');
			model.remove('Balloon', 'armyCamp');
		});
	});
});

describe('Army list query parsing', function () {
	function parse(query: string) {
		return server.army.parseArmyListQuery(new URLSearchParams(query));
	}

	it('Should parse units, equipment and pets out of the `units` param', function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const puppetId = EquipmentModel.requireByName('Barbarian Puppet', gameData).id;
		const lassiId = PetModel.requireByName('Lassi', gameData).id;

		const query = parse(`units=u${barbarianId}-e${puppetId}-p${lassiId}`);

		assert.deepEqual(query.units, [barbarianId]);
		assert.deepEqual(query.equipments, [puppetId]);
		assert.deepEqual(query.pets, [lassiId]);
	});

	it('Should drop malformed `units` parts individually, keeping the valid ones', function () {
		const barbarianId = UnitModel.requireTroopByName('Barbarian', gameData).id;
		const archerId = UnitModel.requireTroopByName('Archer', gameData).id;

		const query = parse(`units=u${barbarianId}-uNOPE-u-u1.5-u-3-x9-u${archerId}`);

		assert.deepEqual(query.units, [barbarianId, archerId]);
		assert.strictEqual(query.equipments, undefined);
		assert.strictEqual(query.pets, undefined);
	});

	it('Should cap each pick type at its own maximum rather than dropping the filter', function () {
		const units = Array.from({ length: MAX_FILTER_UNITS + 10 }, (_, i) => `u${i + 1}`);
		const equipment = Array.from({ length: MAX_FILTER_EQUIPMENTS + 10 }, (_, i) => `e${i + 1}`);
		const pets = Array.from({ length: MAX_FILTER_PETS + 10 }, (_, i) => `p${i + 1}`);

		const query = parse(`units=${[...units, ...equipment, ...pets].join('-')}`);

		assert.lengthOf(query.units ?? [], MAX_FILTER_UNITS);
		assert.lengthOf(query.equipments ?? [], MAX_FILTER_EQUIPMENTS);
		assert.lengthOf(query.pets ?? [], MAX_FILTER_PETS);
	});

	it('Should map tag codes back to tags, ignoring unknown codes', function () {
		const [tag1, tag2] = ARMY_TAGS;

		const query = parse(`tags=${ARMY_TAG_CODES[tag1]}-NotATag-${ARMY_TAG_CODES[tag2]}`);

		assert.deepEqual(query.tags, [tag1, tag2]);
		assert.strictEqual(parse('tags=NotATag').tags, undefined);
	});

	it('Should coerce boolean filters and ignore junk values', function () {
		assert.equal(parse('hasClanCastle=true').hasClanCastle, true);
		assert.equal(parse('hasClanCastle=FALSE').hasClanCastle, false);
		assert.strictEqual(parse('hasClanCastle=maybe').hasClanCastle, undefined);
		// These only ever narrow, so only "true" means anything
		assert.equal(parse('noSuperTroops=true').noSuperTroops, true);
		assert.strictEqual(parse('noSuperTroops=false').noSuperTroops, undefined);
	});

	it('Should ignore out-of-range or non-numeric town halls', function () {
		assert.equal(parse('townHall=16').townHall, 16);
		assert.strictEqual(parse('townHall=abc').townHall, undefined);
		assert.strictEqual(parse('townHall=0').townHall, undefined);
		assert.strictEqual(parse('townHall=-3').townHall, undefined);
	});

	it('Should ignore an unknown attack type', function () {
		assert.equal(parse('attackType=Air').attackType, 'Air');
		assert.strictEqual(parse('attackType=Underground').attackType, undefined);
	});

	it('Should drop a search term longer than the maximum', function () {
		assert.equal(parse(`search=${'a'.repeat(MAX_FILTER_SEARCH_LENGTH)}`).search, 'a'.repeat(MAX_FILTER_SEARCH_LENGTH));
		assert.strictEqual(parse(`search=${'a'.repeat(MAX_FILTER_SEARCH_LENGTH + 1)}`).search, undefined);
		assert.strictEqual(parse('search=').search, undefined);
	});

	it('Should fall back to page one for a missing or malformed page', function () {
		assert.strictEqual(parse('').page, undefined);
		assert.strictEqual(parse('page=abc').page, undefined);
		assert.strictEqual(parse('page=0').page, undefined);
		assert.strictEqual(parse('page=-2').page, undefined);
		assert.strictEqual(parse('page=1.5').page, undefined);
		assert.equal(parse('page=3').page, 3);
	});

	it('Should keep a page beyond the max out of range instead of falling back to page one', function () {
		assert.equal(parse(`page=${MAX_PAGE}`).page, MAX_PAGE);
		// Clamped just past the last servable page, so it returns nothing (with a real total) but keeps the OFFSET bounded
		assert.equal(parse(`page=${MAX_PAGE + 1}`).page, MAX_PAGE + 1);
		assert.equal(parse('page=999999999').page, MAX_PAGE + 1);
	});
});
