import { createHash } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import JSON5 from 'json5';
import type { Server } from '#server/api/Server.ts';
import { helpers, type Database } from '#server/db.ts';
import { logger, type Logger } from '#server/logger.ts';
import {
	createStaticGameData,
	type Unit,
	type Equipment,
	type Pet,
	type TownHall,
	type StaticGameData,
	type Hero,
	type UnitType,
	type UnitLevel,
	type EquipmentLevel,
	type PetLevel,
} from '#shared/gameData.ts';
import { GameDataSchema, type GameData as GameDataType, type GameDataUnit } from './schema';

export type GameDataSettings = {
	/**
	 * Absolute path to the game data file.
	 * Useful as an option for unit testing.
	 * @default $CWD/game-data.json5
	 */
	filePath?: string;
};

type GetUnitsOptions = {
	type?: UnitType;
};

export class GameData implements StaticGameData {
	private server: Server;
	private log: Logger;
	private settings: GameDataSettings;

	private _data: StaticGameData | undefined;

	constructor(server: Server, settings: GameDataSettings = {}) {
		this.server = server;
		this.log = logger('clash-armies:data-sync');
		this.settings = settings;
	}

	/**
	 * Static game data cache, populated by `loadData` during server init.
	 * This DB data is immutable post-startup and should not be modified at runtime.
	 *
	 * Approximate RAM usage: ~185KB (at time of this commit). But unless big schema
	 * changes happen in theory this shouldn't ever drastically increase.
	 */
	private get data(): StaticGameData {
		if (!this._data) {
			throw new Error('Game data accessed before being loaded');
		}
		return this._data;
	}

	/** Game units static data */
	public get units() {
		return this.data.units;
	}

	/** Game town halls static data */
	public get townHalls() {
		return this.data.townHalls;
	}

	/** Game equipment static data */
	public get equipment() {
		return this.data.equipment;
	}

	/** Game pets static data */
	public get pets() {
		return this.data.pets;
	}

	/** Game heroes static data */
	public get heroes() {
		return this.data.heroes;
	}

	/** Game units static data, grouped by type */
	public get unitsByType() {
		return this.data.unitsByType;
	}

	/**
	 * Indexed lookups over the static data above.
	 *
	 * This is the same index the client builds from app state, so lookups read identically on both sides.
	 */
	public get index() {
		return this.data.index;
	}

	/**
	 * Sync game data to the database.
	 *
	 * Reads game data file and upserts all data into the DB.
	 *
	 * File content is hashed and persisted, so on subsequent
	 * startups we skip upsertion if hash is unchanged.
	 *
	 * Importantly, this is intended to be ran *after* migrations but *before* APIs that read game data.
	 *
	 * NOTE on deletions: sync mostly just upserts; deletions are not supported, since armies may reference data.
	 * The exception is `heroMaxLevels` since adjusting what heroes a town hall has access to is an operation that
	 * feasibly could happen, e.g. BK unlocks at TH4 instead of TH7 (https://supercell.com/en/games/clashofclans/blog/release-notes/may-update)
	 */
	public async sync() {
		const { db } = this.server;
		const gameDataContent = await fsp.readFile(this.gameDataPath, 'utf8');
		const hash = createHash('sha256').update(gameDataContent).digest('hex');

		const existing = await db.selectFrom('game_data_sync').selectAll().executeTakeFirst();
		if (existing?.hash === hash) {
			this.log.info('Game data unchanged, skipping sync');
			return;
		}

		this.log.info('Game data changed, syncing...');
		const t0 = performance.now();

		const raw = JSON5.parse(gameDataContent);
		const data = GameDataSchema.parse(raw);

		await db.transaction().execute(async (tx) => {
			await this.syncHeroes(tx, data);
			await this.syncTownHalls(tx, data);
			await this.syncUnits(tx, 'Troop', data.troops);
			await this.syncUnits(tx, 'Spell', data.spells);
			await this.syncUnits(tx, 'Siege', data.sieges);
			await this.syncPets(tx, data);
			await this.syncEquipment(tx, data);
			await helpers.upsert(tx, 'game_data_sync', [{ id: 1, hash }]);
		});

		const t1 = performance.now();
		this.log.info(`Game data synced in ${(t1 - t0).toFixed(2)}ms`);
	}

	/**
	 * Loads game data from the database and indexes it.
	 * Intended to be ran after `sync` has occurred.
	 */
	public async loadData() {
		this._data = createStaticGameData({
			units: await this.getUnitsData(),
			equipment: await this.getEquipmentData(),
			pets: await this.getPetsData(),
			townHalls: await this.getTownHallsData(),
			heroes: await this.getHeroesData(),
		});
	}

	private async syncHeroes(db: Database, data: GameDataType) {
		const heroRows = data.heroes.map((h, idx) => {
			return { name: h.name, clashId: h.clashId, order: idx };
		});
		await helpers.upsert(db, 'heroes', heroRows);
	}

	private async syncTownHalls(db: Database, data: GameDataType) {
		const thRows = data.townHalls.map((th) => {
			return {
				level: th.level,
				maxBarracks: th.maxBarracks,
				maxDarkBarracks: th.maxDarkBarracks,
				maxLaboratory: th.maxLaboratory,
				maxSpellFactory: th.maxSpellFactory,
				maxDarkSpellFactory: th.maxDarkSpellFactory,
				maxWorkshop: th.maxWorkshop,
				maxCc: th.maxCc,
				maxBlacksmith: th.maxBlacksmith,
				maxPetHouse: th.maxPetHouse,
				troopCapacity: th.troopCapacity,
				spellCapacity: th.spellCapacity,
				siegeCapacity: th.siegeCapacity,
				ccLaboratoryCap: th.ccLaboratoryCap,
				ccTroopCapacity: th.ccTroopCapacity,
				ccSpellCapacity: th.ccSpellCapacity,
				ccSiegeCapacity: th.ccSiegeCapacity,
			};
		});
		await helpers.upsert(db, 'town_halls', thRows);

		// Heroes moving between town hall levels is the most likely balance change to occur.
		// We delete+re-insert (cost of this is negligable) to allow deletions to this part of the game data.
		const heroMaxRows = data.townHalls.flatMap((th) => {
			if (!th.heroMaxLevels) {
				return [];
			}
			return th.heroMaxLevels.map((h) => {
				return { townHall: th.level, heroName: h.hero, maxLevel: h.maxLevel };
			});
		});
		await db.deleteFrom('town_hall_heroes_max').execute();
		if (heroMaxRows.length) {
			await db.insertInto('town_hall_heroes_max').values(heroMaxRows).execute();
		}
	}

	private async syncUnits(db: Database, type: 'Troop' | 'Spell' | 'Siege', units: GameDataUnit[]) {
		const unitRows = units.map((u, idx) => {
			return {
				type,
				name: u.name,
				clashId: u.clashId,
				productionBuilding: u.productionBuilding,
				housingSpace: u.housingSpace,
				isSuper: u.isSuper,
				isFlying: u.isFlying,
				isJumper: u.isJumper,
				airTargets: u.airTargets,
				groundTargets: u.groundTargets,
				order: idx,
			};
		});
		await helpers.upsert(db, 'units', unitRows);

		const idRows = await db.selectFrom('units').where('type', '=', type).selectAll().execute();
		const idByName = new Map(idRows.map((r) => [r.name, r.id]));

		const levelRows = units.flatMap((u) => {
			return u.levels.map((l) => {
				const unitId = idByName.get(u.name);
				if (!unitId) {
					throw new Error(`Missing unit ID for unit "${u.name}"`);
				}
				return {
					unitId,
					level: l.level,
					buildingLevel: l.buildingLevel,
					laboratoryLevel: l.laboratoryLevel,
				};
			});
		});
		await helpers.upsert(db, 'unit_levels', levelRows);
	}

	private async syncPets(db: Database, data: GameDataType) {
		const petRows = data.pets.map((p, idx) => {
			return { name: p.name, clashId: p.clashId, order: idx };
		});
		await helpers.upsert(db, 'pets', petRows);

		const idRows = await db.selectFrom('pets').selectAll().execute();
		const idByName = new Map(idRows.map((r) => [r.name, r.id]));

		const levelRows = data.pets.flatMap((p) => {
			return p.levels.map((l) => {
				const petId = idByName.get(p.name);
				if (!petId) {
					throw new Error(`Missing pet ID for pet "${p.name}"`);
				}
				return {
					petId,
					level: l.level,
					petHouseLevel: l.petHouseLevel,
				};
			});
		});
		await helpers.upsert(db, 'pet_levels', levelRows);
	}

	private async syncEquipment(db: Database, data: GameDataType) {
		const equipmentRows = data.equipment.map((e, idx) => {
			return {
				hero: e.hero,
				name: e.name,
				epic: e.epic,
				clashId: e.clashId,
				order: idx,
			};
		});
		await helpers.upsert(db, 'equipment', equipmentRows);

		const idRows = await db.selectFrom('equipment').selectAll().execute();
		const idByKey = new Map();
		for (const row of idRows) {
			idByKey.set(`${row.hero}:${row.name}`, row.id);
		}

		const levelRows = data.equipment.flatMap((eq) => {
			return eq.levels.map((l) => {
				const key = `${eq.hero}:${eq.name}`;
				const equipmentId = idByKey.get(key);
				if (!equipmentId) {
					throw new Error(`Missing equipment ID for equipment "${eq.name}"`);
				}
				return {
					equipmentId,
					level: l.level,
					blacksmithLevel: l.blacksmithLevel,
				};
			});
		});
		await helpers.upsert(db, 'equipment_levels', levelRows);
	}

	private async getUnitsData(options: GetUnitsOptions = {}) {
		const { type } = options;

		let query = this.server.db.selectFrom('units as u').leftJoin('unit_levels as ul', 'ul.unitId', 'u.id');

		if (type) {
			query = query.where('u.type', '=', type);
		}

		const units: Unit[] = await query
			.select([
				'u.id',
				'u.type',
				'u.name',
				'u.clashId',
				'u.order',
				'u.housingSpace',
				'u.productionBuilding',
				'u.isSuper',
				'u.isFlying',
				'u.isJumper',
				'u.airTargets',
				'u.groundTargets',
				helpers
					.jsonAggObj<UnitLevel>(
						{
							id: 'ul.id',
							unitId: 'ul.unitId',
							level: 'ul.level',
							buildingLevel: 'ul.buildingLevel',
							laboratoryLevel: 'ul.laboratoryLevel',
						},
						{ order: 'ul.level' }
					)
					.as('levels'),
			])
			.groupBy('u.id')
			.orderBy('u.order')
			.execute();

		return units;
	}

	private async getEquipmentData() {
		const equipment: Equipment[] = await this.server.db
			.selectFrom('equipment as eq')
			.leftJoin('equipment_levels as eql', 'eql.equipmentId', 'eq.id')
			.select([
				'eq.id',
				'eq.hero',
				'eq.name',
				'eq.clashId',
				'eq.order',
				'eq.epic',
				helpers
					.jsonAggObj<EquipmentLevel>(
						{
							id: 'eql.id',
							equipmentId: 'eql.equipmentId',
							level: 'eql.level',
							blacksmithLevel: 'eql.blacksmithLevel',
						},
						{ order: 'eql.level' }
					)
					.as('levels'),
			])
			.groupBy('eq.id')
			.orderBy('eq.order')
			.execute();

		return equipment;
	}

	private async getPetsData() {
		const pets: Pet[] = await this.server.db
			.selectFrom('pets as p')
			.leftJoin('pet_levels as pl', 'pl.petId', 'p.id')
			.select([
				'p.id',
				'p.name',
				'p.clashId',
				'p.order',
				helpers
					.jsonAggObj<PetLevel>(
						{
							id: 'pl.id',
							petId: 'pl.petId',
							level: 'pl.level',
							petHouseLevel: 'pl.petHouseLevel',
						},
						{ order: 'pl.level' }
					)
					.as('levels'),
			])
			.groupBy('p.id')
			.orderBy('p.order')
			.execute();

		return pets;
	}

	private async getTownHallsData(): Promise<TownHall[]> {
		const ths = await this.server.db.selectFrom('town_halls').selectAll().select('level as id').orderBy('level').execute();
		const maxes = await this.server.db.selectFrom('town_hall_heroes_max').select(['townHall', 'heroName', 'maxLevel']).execute();

		const maxesByTH = new Map<number, Partial<Record<string, number>>>();
		for (const m of maxes) {
			if (!maxesByTH.has(m.townHall)) {
				maxesByTH.set(m.townHall, {});
			}
			maxesByTH.get(m.townHall)![m.heroName] = m.maxLevel;
		}

		return ths.map((th) => {
			return {
				...th,
				heroMaxLevels: maxesByTH.get(th.level) ?? {},
			};
		});
	}

	private async getHeroesData(): Promise<Hero[]> {
		return this.server.db.selectFrom('heroes as h').select(['name', 'clashId', 'order']).orderBy('order').execute();
	}

	private get gameDataPath() {
		if (typeof this.settings?.filePath === 'string') {
			return this.settings.filePath;
		}
		return path.join(process.cwd(), 'game-data.json5');
	}
}
