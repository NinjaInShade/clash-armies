import { describe, it, beforeEach, beforeAll, afterAll } from 'vitest';
import { assert } from '../testutil';
import fsp from 'node:fs/promises';
import path from 'node:path';
import JSON5 from 'json5';
import { db } from '$server/db';
import { Server } from '$server/api/Server';
import type { GameData, GameDataEquipment, GameDataHero, GameDataPet, GameDataTownHall, GameDataUnit } from '~/lib/server/game-data/schema';
import type { UnitType } from '~/lib/shared/types';

// TODO: better sync update tests, such as asserting renaming failing if armies use it, etc...

describe('Game data sync', function () {
	const GAME_DATA_PATH = path.join(process.cwd(), 'tests/fixtures/game-data.json5');
	const EMPTY_GAME_DATA: GameData = {
		townHalls: [],
		heroes: [],
		troops: [],
		spells: [],
		sieges: [],
		pets: [],
		equipment: [],
	};

	const server = new Server(db, {
		gameData: {
			filePath: GAME_DATA_PATH,
		},
	});

	let gameData = structuredClone(EMPTY_GAME_DATA);
	async function syncGameData() {
		await fsp.writeFile(GAME_DATA_PATH, JSON5.stringify(gameData));
		await server.gameData.sync();
	}

	async function clearTables() {
		const deleteTables = [
			'game_data_sync',
			'equipment_levels',
			'equipment',
			'pet_levels',
			'pets',
			'unit_levels',
			'units',
			'town_hall_heroes_max',
			'town_halls',
			'heroes',
		];
		for (const tbl of deleteTables) {
			await server.db.delete(tbl);
		}
	}

	function omitKeys(rows: Record<string, unknown>[], keys: string[]) {
		return rows.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k))));
	}

	beforeEach(async function () {
		// TODO: not very efficient running this every test...
		await clearTables();
		gameData = structuredClone(EMPTY_GAME_DATA);
	});

	beforeAll(async function () {
		await server.init();
	});

	afterAll(async function () {
		await fsp.writeFile(GAME_DATA_PATH, JSON5.stringify(EMPTY_GAME_DATA));
		await clearTables();
		await server.dispose();
	});

	describe('Heroes sync', function () {
		async function assertHeroes(expected: unknown[]) {
			const data = await server.db.getRows('heroes');
			assert.sameDeepMembers(data, expected);
		}

		function heroRow(hero: GameDataHero, idx: number) {
			return { ...hero, order: idx };
		}

		it('should add heroes', async function () {
			const heroes = [
				{ name: 'Barbarian King', clashId: 100 },
				{ name: 'Archer Queen', clashId: 200 },
			];
			const expectHeroes: unknown[] = [];
			for (const [idx, hero] of heroes.entries()) {
				gameData.heroes.push(hero);
				expectHeroes.push(heroRow(hero, idx));
				await syncGameData();
				await assertHeroes(expectHeroes);
			}
		});

		it('should update heroes', async function () {
			// Seed initial hero
			const hero = { name: 'Barbarian King', clashId: 100 };
			gameData.heroes.push(hero);
			await syncGameData();
			await assertHeroes([heroRow(hero, 0)]);

			// Update hero and verify it was updated
			hero.clashId = 101;
			await syncGameData();
			await assertHeroes([heroRow(hero, 0)]);
		});

		it('should NOT delete heroes', async function () {
			// Seed initial hero
			const hero = { name: 'Barbarian King', clashId: 100 };
			gameData.heroes.push(hero);
			await syncGameData();
			await assertHeroes([heroRow(hero, 0)]);

			// Delete hero and verify nothing was updated
			// Note sync upserts so deletion doesn't cause an "error", it just doesn't happen
			gameData.heroes = [];
			await syncGameData();
			await assertHeroes([heroRow(hero, 0)]);
		});
	});

	describe('Town halls sync', function () {
		async function assertTownHalls(expected: unknown[]) {
			const data = await server.db.getRows('town_halls');
			assert.sameDeepMembers(data, expected);
		}

		async function assertTownHallHeroRows(expected: unknown[]) {
			const data = await server.db.getRows('town_hall_heroes_max');
			assert.sameDeepMembers(data, expected);
		}

		function townHallRow(th: GameDataTownHall) {
			const { heroMaxLevels: _, ...row } = th;
			return row;
		}

		function townHallHeroRows(th: GameDataTownHall) {
			if (!th.heroMaxLevels) {
				return [];
			}
			return th.heroMaxLevels.map((hero) => ({
				townHall: th.level,
				heroName: hero.hero,
				maxLevel: hero.maxLevel,
			}));
		}

		it('Should add town halls', async function () {
			const townHalls = [
				{
					level: 1,
					maxBarracks: 1,
					maxDarkBarracks: 2,
					maxLaboratory: 3,
					maxSpellFactory: 4,
					maxDarkSpellFactory: 5,
					maxWorkshop: 6,
					maxCc: 7,
					maxBlacksmith: 8,
					maxPetHouse: 9,
					troopCapacity: 20,
					spellCapacity: 30,
					siegeCapacity: 40,
					ccLaboratoryCap: 50,
					ccTroopCapacity: 60,
					ccSpellCapacity: 70,
					ccSiegeCapacity: 80,
					heroMaxLevels: [
						{
							hero: 'Barbarian King',
							maxLevel: 10,
						},
					],
				},
				{
					level: 2,
					maxBarracks: 2,
					maxDarkBarracks: 3,
					maxLaboratory: 4,
					maxSpellFactory: 5,
					maxDarkSpellFactory: 6,
					maxWorkshop: 7,
					maxCc: 8,
					maxBlacksmith: 9,
					maxPetHouse: 10,
					troopCapacity: 30,
					spellCapacity: 40,
					siegeCapacity: 50,
					ccLaboratoryCap: 60,
					ccTroopCapacity: 70,
					ccSpellCapacity: 80,
					ccSiegeCapacity: 90,
					heroMaxLevels: [
						{
							hero: 'Barbarian King',
							maxLevel: 20,
						},
						{
							hero: 'Archer Queen',
							maxLevel: 10,
						},
					],
				},
			];

			// Seed necessary heroes
			gameData.heroes.push({ name: 'Barbarian King', clashId: 500 });
			gameData.heroes.push({ name: 'Archer Queen', clashId: 501 });
			await syncGameData();

			const expectTownHalls: unknown[] = [];
			const expectTownHallHeroesMax: unknown[] = [];
			for (const th of townHalls) {
				gameData.townHalls.push(th);
				expectTownHalls.push(townHallRow(th));
				expectTownHallHeroesMax.push(...townHallHeroRows(th));
				await syncGameData();
				await assertTownHalls(expectTownHalls);
				await assertTownHallHeroRows(expectTownHallHeroesMax);
			}
		});

		it('should update town hall', async function () {
			const th = {
				level: 1,
				maxBarracks: 1,
				maxDarkBarracks: 2,
				maxLaboratory: 3,
				maxSpellFactory: 4,
				maxDarkSpellFactory: 5,
				maxWorkshop: 6,
				maxCc: 7,
				maxBlacksmith: 8,
				maxPetHouse: 9,
				troopCapacity: 20,
				spellCapacity: 30,
				siegeCapacity: 40,
				ccLaboratoryCap: 50,
				ccTroopCapacity: 60,
				ccSpellCapacity: 70,
				ccSiegeCapacity: 80,
				heroMaxLevels: [
					{
						hero: 'Barbarian King',
						maxLevel: 10,
					},
				],
			};

			// Seed necessary heroes
			gameData.heroes.push({ name: 'Barbarian King', clashId: 500 });
			gameData.heroes.push({ name: 'Archer Queen', clashId: 501 });
			await syncGameData();

			// Seed initial town hall
			gameData.townHalls.push(th);
			await syncGameData();
			await assertTownHalls([townHallRow(th)]);
			await assertTownHallHeroRows([...townHallHeroRows(th)]);

			// Update town hall (base+hero max levels) and verify both were updated
			th.maxBarracks = 15;
			th.maxCc = 20;
			th.troopCapacity = 500;
			th.heroMaxLevels[0].maxLevel = 50;
			th.heroMaxLevels.push({ hero: 'Archer Queen', maxLevel: 100 });
			await syncGameData();
			await assertTownHalls([townHallRow(th)]);
			await assertTownHallHeroRows([...townHallHeroRows(th)]);
		});

		it('should NOT delete town hall', async function () {
			const th = {
				level: 1,
				maxBarracks: 1,
				maxDarkBarracks: 2,
				maxLaboratory: 3,
				maxSpellFactory: 4,
				maxDarkSpellFactory: 5,
				maxWorkshop: 6,
				maxCc: 7,
				maxBlacksmith: 8,
				maxPetHouse: 9,
				troopCapacity: 20,
				spellCapacity: 30,
				siegeCapacity: 40,
				ccLaboratoryCap: 50,
				ccTroopCapacity: 60,
				ccSpellCapacity: 70,
				ccSiegeCapacity: 80,
				heroMaxLevels: [
					{
						hero: 'Barbarian King',
						maxLevel: 10,
					},
				],
			};

			// Seed necessary hero
			gameData.heroes.push({ name: 'Barbarian King', clashId: 500 });
			await syncGameData();

			// Seed initial town hall
			gameData.townHalls.push(th);
			await syncGameData();
			await assertTownHalls([townHallRow(th)]);
			await assertTownHallHeroRows([...townHallHeroRows(th)]);

			// Delete town hall and verify nothing was updated
			// Note sync upserts so deletion doesn't cause an "error", it just doesn't happen
			// Note hero max levels *are* deleted (see test case further below) so we only assert those have been cleaned up
			gameData.townHalls = [];
			await syncGameData();
			await assertTownHalls([townHallRow(th)]);
			await assertTownHallHeroRows([]);
		});

		it('should delete town hall max hero levels', async function () {
			const th = {
				level: 1,
				maxBarracks: 1,
				maxDarkBarracks: 2,
				maxLaboratory: 3,
				maxSpellFactory: 4,
				maxDarkSpellFactory: 5,
				maxWorkshop: 6,
				maxCc: 7,
				maxBlacksmith: 8,
				maxPetHouse: 9,
				troopCapacity: 20,
				spellCapacity: 30,
				siegeCapacity: 40,
				ccLaboratoryCap: 50,
				ccTroopCapacity: 60,
				ccSpellCapacity: 70,
				ccSiegeCapacity: 80,
				heroMaxLevels: [
					{
						hero: 'Barbarian King',
						maxLevel: 10,
					},
				],
			};

			// Seed necessary heroes
			gameData.heroes.push({ name: 'Barbarian King', clashId: 500 });
			await syncGameData();

			// Seed initial town hall
			gameData.townHalls.push(th);
			await syncGameData();
			await assertTownHalls([townHallRow(th)]);
			await assertTownHallHeroRows([...townHallHeroRows(th)]);

			// Delete hero max levels
			th.heroMaxLevels = [];
			await syncGameData();
			await assertTownHalls([townHallRow(th)]);
			await assertTownHallHeroRows([]);
		});
	});

	describe('Units sync', function () {
		async function assertUnits(expected: unknown[], unitType: UnitType) {
			const data = await server.db.getRows('units', { type: unitType });
			assert.sameDeepMembers(omitKeys(data, ['id']), expected);
		}

		async function assertUnitLevels(expected: unknown[], unitType: UnitType) {
			const data = await server.db.query(`
                SELECT u.name AS unitName, ul.*
                FROM unit_levels ul
                JOIN units u ON u.id = ul.unitId AND u.type = '${unitType}'
                ORDER BY u.order, ul.level
            `);
			assert.sameDeepMembers(omitKeys(data, ['id', 'unitId']), expected);
		}

		function unitRow(unit: GameDataUnit, unitType: UnitType, idx: number) {
			const { levels: _, ...row } = unit;
			return { ...row, type: unitType, order: idx };
		}

		function unitLevelRows(unit: GameDataUnit) {
			return unit.levels.map((lvl) => ({ unitName: unit.name, ...lvl }));
		}

		// Covers "troops", "spells" and "sieges" sections in the game data file.
		// They are all fundamentally units but separated in the file for ease of use.
		it('Should add units', async function () {
			const troops = [
				{
					name: 'Barbarian',
					clashId: 0,
					productionBuilding: 'Barrack',
					housingSpace: 1,
					isSuper: false,
					isFlying: false,
					isJumper: false,
					airTargets: false,
					groundTargets: true,
					levels: [
						{
							level: 1,
							buildingLevel: 10,
							laboratoryLevel: 20,
						},
					],
				},
				{
					name: 'Archer',
					clashId: 1,
					productionBuilding: 'Barrack',
					housingSpace: 100,
					isSuper: true,
					isFlying: true,
					isJumper: false,
					airTargets: false,
					groundTargets: true,
					levels: [
						{
							level: 1,
							buildingLevel: 20,
							laboratoryLevel: 20,
						},
						{
							level: 2,
							buildingLevel: 30,
							laboratoryLevel: 30,
						},
					],
				},
			];
			const spells = [
				{
					name: 'Lightning',
					clashId: 0,
					productionBuilding: 'Spell Factory',
					housingSpace: 1,
					isSuper: false,
					isFlying: false,
					isJumper: false,
					airTargets: false,
					groundTargets: true,
					levels: [
						{
							level: 1,
							buildingLevel: 40,
							laboratoryLevel: 40,
						},
					],
				},
				{
					name: 'Poison',
					clashId: 1,
					productionBuilding: 'Dark Spell Factory',
					housingSpace: 100,
					isSuper: true,
					isFlying: true,
					isJumper: false,
					airTargets: false,
					groundTargets: true,
					levels: [
						{
							level: 1,
							buildingLevel: 50,
							laboratoryLevel: 55,
						},
						{
							level: 2,
							buildingLevel: 70,
							laboratoryLevel: 100,
						},
					],
				},
			];
			const sieges = [
				{
					name: 'Wall Wrecker',
					clashId: 0,
					productionBuilding: 'Siege Workshop',
					housingSpace: 1,
					isSuper: false,
					isFlying: false,
					isJumper: false,
					airTargets: false,
					groundTargets: true,
					levels: [
						{
							level: 1,
							buildingLevel: 25,
							laboratoryLevel: 15,
						},
					],
				},
				{
					name: 'Battle Blimp',
					clashId: 1,
					productionBuilding: 'Siege Workshop',
					housingSpace: 100,
					isSuper: true,
					isFlying: true,
					isJumper: false,
					airTargets: false,
					groundTargets: true,
					levels: [
						{
							level: 1,
							buildingLevel: 88,
							laboratoryLevel: 88,
						},
						{
							level: 2,
							buildingLevel: 99,
							laboratoryLevel: 99,
						},
					],
				},
			];
			const expectUnits: Record<string, unknown[]> = {
				Troop: [],
				Spell: [],
				Siege: [],
			};
			const expectLevels: Record<string, unknown[]> = {
				Troop: [],
				Spell: [],
				Siege: [],
			};
			const unitTypes = [
				['Troop', troops, gameData.troops],
				['Spell', spells, gameData.spells],
				['Siege', sieges, gameData.sieges],
			] as const;
			for (const [type, units, gameDataArr] of unitTypes) {
				for (const [idx, unit] of units.entries()) {
					gameDataArr.push(unit);
					expectUnits[type].push(unitRow(unit, type, idx));
					expectLevels[type].push(...unitLevelRows(unit));
					await syncGameData();
					await assertUnits(expectUnits[type], type);
					await assertUnitLevels(expectLevels[type], type);
				}
			}
		});

		it('Should update units', async function () {
			// Seed initial unit(s)
			const troop = {
				name: 'Barbarian',
				clashId: 0,
				productionBuilding: 'Barrack',
				housingSpace: 1,
				isSuper: false,
				isFlying: false,
				isJumper: false,
				airTargets: false,
				groundTargets: true,
				levels: [
					{
						level: 1,
						buildingLevel: 10,
						laboratoryLevel: 20,
					},
				],
			};
			const spell = {
				name: 'Lightning',
				clashId: 0,
				productionBuilding: 'Spell Factory',
				housingSpace: 1,
				isSuper: false,
				isFlying: false,
				isJumper: false,
				airTargets: false,
				groundTargets: true,
				levels: [
					{
						level: 1,
						buildingLevel: 40,
						laboratoryLevel: 40,
					},
				],
			};
			const siege = {
				name: 'Wall Wrecker',
				clashId: 0,
				productionBuilding: 'Siege Workshop',
				housingSpace: 1,
				isSuper: false,
				isFlying: false,
				isJumper: false,
				airTargets: false,
				groundTargets: true,
				levels: [
					{
						level: 1,
						buildingLevel: 25,
						laboratoryLevel: 15,
					},
				],
			};
			gameData.troops.push(troop);
			gameData.spells.push(spell);
			gameData.sieges.push(siege);
			await syncGameData();
			await assertUnits([unitRow(troop, 'Troop', 0)], 'Troop');
			await assertUnits([unitRow(spell, 'Spell', 0)], 'Spell');
			await assertUnits([unitRow(siege, 'Siege', 0)], 'Siege');
			await assertUnitLevels([...unitLevelRows(troop)], 'Troop');
			await assertUnitLevels([...unitLevelRows(spell)], 'Spell');
			await assertUnitLevels([...unitLevelRows(siege)], 'Siege');

			// Update units (base+levels) and verify both were updated
			troop.clashId = 1;
			troop.levels[0].buildingLevel = 100;
			troop.levels.push({ level: 2, buildingLevel: 200, laboratoryLevel: 50 });
			spell.clashId = 1;
			spell.levels[0].buildingLevel = 100;
			spell.levels.push({ level: 2, buildingLevel: 200, laboratoryLevel: 50 });
			siege.clashId = 1;
			siege.levels[0].buildingLevel = 100;
			siege.levels.push({ level: 2, buildingLevel: 200, laboratoryLevel: 50 });
			await syncGameData();
			await assertUnits([unitRow(troop, 'Troop', 0)], 'Troop');
			await assertUnits([unitRow(spell, 'Spell', 0)], 'Spell');
			await assertUnits([unitRow(siege, 'Siege', 0)], 'Siege');
			await assertUnitLevels([...unitLevelRows(troop)], 'Troop');
			await assertUnitLevels([...unitLevelRows(spell)], 'Spell');
			await assertUnitLevels([...unitLevelRows(siege)], 'Siege');
		});

		it('should NOT delete units', async function () {
			// Seed initial unit(s)
			const troop = {
				name: 'Barbarian',
				clashId: 0,
				productionBuilding: 'Barrack',
				housingSpace: 1,
				isSuper: false,
				isFlying: false,
				isJumper: false,
				airTargets: false,
				groundTargets: true,
				levels: [
					{
						level: 1,
						buildingLevel: 10,
						laboratoryLevel: 20,
					},
				],
			};
			const spell = {
				name: 'Lightning',
				clashId: 0,
				productionBuilding: 'Spell Factory',
				housingSpace: 1,
				isSuper: false,
				isFlying: false,
				isJumper: false,
				airTargets: false,
				groundTargets: true,
				levels: [
					{
						level: 1,
						buildingLevel: 40,
						laboratoryLevel: 40,
					},
				],
			};
			const siege = {
				name: 'Wall Wrecker',
				clashId: 0,
				productionBuilding: 'Siege Workshop',
				housingSpace: 1,
				isSuper: false,
				isFlying: false,
				isJumper: false,
				airTargets: false,
				groundTargets: true,
				levels: [
					{
						level: 1,
						buildingLevel: 25,
						laboratoryLevel: 15,
					},
				],
			};
			gameData.troops.push(troop);
			gameData.spells.push(spell);
			gameData.sieges.push(siege);
			await syncGameData();
			await assertUnits([unitRow(troop, 'Troop', 0)], 'Troop');
			await assertUnits([unitRow(spell, 'Spell', 0)], 'Spell');
			await assertUnits([unitRow(siege, 'Siege', 0)], 'Siege');
			await assertUnitLevels([...unitLevelRows(troop)], 'Troop');
			await assertUnitLevels([...unitLevelRows(spell)], 'Spell');
			await assertUnitLevels([...unitLevelRows(siege)], 'Siege');

			// Delete units (base+levels) and verify nothing was updated
			// Note sync upserts so deletion doesn't cause an "error", it just doesn't happen
			gameData.troops = [];
			gameData.spells = [];
			gameData.sieges = [];
			await syncGameData();
			await assertUnits([unitRow(troop, 'Troop', 0)], 'Troop');
			await assertUnits([unitRow(spell, 'Spell', 0)], 'Spell');
			await assertUnits([unitRow(siege, 'Siege', 0)], 'Siege');
			await assertUnitLevels([...unitLevelRows(troop)], 'Troop');
			await assertUnitLevels([...unitLevelRows(spell)], 'Spell');
			await assertUnitLevels([...unitLevelRows(siege)], 'Siege');
		});
	});

	describe('Pets sync', function () {
		async function assertPets(expected: unknown[]) {
			const data = await server.db.getRows('pets');
			assert.sameDeepMembers(omitKeys(data, ['id']), expected);
		}

		async function assertPetLevels(expected: unknown[]) {
			const data = await server.db.query(`
                SELECT p.name AS petName, pl.*
                FROM pet_levels pl
                JOIN pets p ON p.id = pl.petId
                ORDER BY p.order, pl.level
            `);
			assert.sameDeepMembers(omitKeys(data, ['id', 'petId']), expected);
		}

		function petRow(pet: GameDataPet, idx: number) {
			const { levels: _, ...row } = pet;
			return { ...row, order: idx };
		}

		function petLevelRows(pet: GameDataPet) {
			return pet.levels.map((lvl) => ({ petName: pet.name, ...lvl }));
		}

		it('Should add pets', async function () {
			const pets = [
				{
					name: 'Lassi',
					clashId: 0,
					levels: [
						{
							level: 1,
							petHouseLevel: 1,
						},
						{
							level: 2,
							petHouseLevel: 2,
						},
					],
				},
				{
					name: 'Frosty',
					clashId: 1,
					levels: [
						{
							level: 1,
							petHouseLevel: 5,
						},
						{
							level: 2,
							petHouseLevel: 10,
						},
					],
				},
			];
			const expectPets: unknown[] = [];
			const expectPetLevels: unknown[] = [];
			for (const [idx, pet] of pets.entries()) {
				gameData.pets.push(pet);
				expectPets.push(petRow(pet, idx));
				expectPetLevels.push(...petLevelRows(pet));
				await syncGameData();
				await assertPets(expectPets);
				await assertPetLevels(expectPetLevels);
			}
		});

		it('Should update pet', async function () {
			// Seed initial pet
			const pet = {
				name: 'Lassi',
				clashId: 0,
				levels: [
					{
						level: 1,
						petHouseLevel: 1,
					},
					{
						level: 2,
						petHouseLevel: 2,
					},
				],
			};
			gameData.pets.push(pet);
			await syncGameData();
			await assertPets([petRow(pet, 0)]);
			await assertPetLevels([...petLevelRows(pet)]);

			// Update pet (base+levels) and verify both were updated
			pet.clashId = 1;
			pet.levels[1].petHouseLevel = 5;
			pet.levels.push({ level: 3, petHouseLevel: 10 });
			await syncGameData();
			await assertPets([petRow(pet, 0)]);
			await assertPetLevels([...petLevelRows(pet)]);
		});

		it('should NOT delete pet', async function () {
			// Seed initial pet
			const pet = {
				name: 'Lassi',
				clashId: 0,
				levels: [
					{
						level: 1,
						petHouseLevel: 1,
					},
					{
						level: 2,
						petHouseLevel: 2,
					},
				],
			};
			gameData.pets.push(pet);
			await syncGameData();
			await assertPets([petRow(pet, 0)]);
			await assertPetLevels([...petLevelRows(pet)]);

			// Delete pet (base+levels) and verify nothing was updated
			// Note sync upserts so deletion doesn't cause an "error", it just doesn't happen
			gameData.pets = [];
			await syncGameData();
			await assertPets([petRow(pet, 0)]);
			await assertPetLevels([...petLevelRows(pet)]);
		});
	});

	describe('Equipment sync', function () {
		async function assertEq(expected: unknown[]) {
			const data = await server.db.getRows('equipment');
			assert.sameDeepMembers(omitKeys(data, ['id']), expected);
		}

		async function assertEqLevels(expected: unknown[]) {
			const data = await server.db.query(`
                SELECT eq.name AS eqName, eql.*
                FROM equipment_levels eql
                JOIN equipment eq ON eq.id = eql.equipmentId
                ORDER BY eq.order, eql.level
            `);
			assert.sameDeepMembers(omitKeys(data, ['id', 'equipmentId']), expected);
		}

		function eqRow(eq: GameDataEquipment, idx: number) {
			const { levels: _, ...row } = eq;
			return { ...row, order: idx };
		}

		function eqLevelRows(eq: GameDataEquipment) {
			return eq.levels.map((lvl) => ({ eqName: eq.name, ...lvl }));
		}

		it('Should add equipment', async function () {
			const equipment = [
				{
					name: 'Barbarian Puppet',
					hero: 'Barbarian King',
					epic: false,
					clashId: 0,
					levels: [
						{
							level: 1,
							blacksmithLevel: null,
						},
						{
							level: 2,
							blacksmithLevel: 5,
						},
					],
				},
				{
					name: 'Giant Arrow',
					hero: 'Archer Queen',
					epic: true,
					clashId: 17,
					levels: [
						{
							level: 1,
							blacksmithLevel: 5,
						},
						{
							level: 2,
							blacksmithLevel: 10,
						},
					],
				},
			];

			// Seed necessary heroes
			gameData.heroes.push({ name: 'Barbarian King', clashId: 100 });
			gameData.heroes.push({ name: 'Archer Queen', clashId: 200 });
			await syncGameData();

			const expectEq: unknown[] = [];
			const expectEqLevels: unknown[] = [];
			for (const [idx, eq] of equipment.entries()) {
				gameData.equipment.push(eq);
				expectEq.push(eqRow(eq, idx));
				expectEqLevels.push(...eqLevelRows(eq));
				await syncGameData();
				await assertEq(expectEq);
				await assertEqLevels(expectEqLevels);
			}
		});

		it('Should update equipment', async function () {
			// Seed necessary hero
			gameData.heroes.push({ name: 'Barbarian King', clashId: 100 });
			await syncGameData();

			// Seed initial equipment
			const eq = {
				name: 'Barbarian Puppet',
				hero: 'Barbarian King',
				epic: false,
				clashId: 0,
				levels: [
					{
						level: 1,
						blacksmithLevel: null,
					},
					{
						level: 2,
						blacksmithLevel: 5,
					},
				],
			};
			gameData.equipment.push(eq);
			await syncGameData();
			await assertEq([eqRow(eq, 0)]);
			await assertEqLevels([...eqLevelRows(eq)]);

			// Update equipment (base+levels) and verify both were updated
			eq.clashId = 1;
			eq.epic = true;
			eq.levels[0].blacksmithLevel = 1;
			eq.levels.push({ level: 3, blacksmithLevel: 10 });
			await syncGameData();
			await assertEq([eqRow(eq, 0)]);
			await assertEqLevels([...eqLevelRows(eq)]);
		});

		it('should NOT delete equipment', async function () {
			// Seed necessary hero
			gameData.heroes.push({ name: 'Barbarian King', clashId: 100 });
			await syncGameData();

			// Seed initial equipment
			const eq = {
				name: 'Barbarian Puppet',
				hero: 'Barbarian King',
				epic: false,
				clashId: 0,
				levels: [
					{
						level: 1,
						blacksmithLevel: null,
					},
					{
						level: 2,
						blacksmithLevel: 5,
					},
				],
			};
			gameData.equipment.push(eq);
			await syncGameData();
			await assertEq([eqRow(eq, 0)]);
			await assertEqLevels([...eqLevelRows(eq)]);

			// Delete equipment (base+levels) and verify nothing was updated
			// Note sync upserts so deletion doesn't cause an "error", it just doesn't happen
			gameData.equipment = [];
			await syncGameData();
			await assertEq([eqRow(eq, 0)]);
			await assertEqLevels([...eqLevelRows(eq)]);
		});
	});
});
