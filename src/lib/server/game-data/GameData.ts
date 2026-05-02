import util from '@ninjalib/util';
import type { MySQL } from '@ninjalib/sql';
import type { Server } from '$server/api/Server';
import type { Unit, Equipment, Pet, TownHall, StaticGameData, Hero, UnitType } from '$types';
import { GameDataSchema, type GameData as GameDataType, type GameDataUnit } from './schema';
import { parseDBJsonField } from '$server/utils';
import { encodeUnitName } from '$shared/utils';
import JSON5 from 'json5';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { createHash } from 'node:crypto';

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

export class GameData {
	private server: Server;
	private log: util.Logger;
	private settings: GameDataSettings;

	/** Game units static data */
	public units: Unit[] = [];
	/** Game equipment static data */
	public equipment: Equipment[] = [];
	/** Game pets static data */
	public pets: Pet[] = [];
	/** Game town halls static data */
	public townHalls: TownHall[] = [];
	/** Game heroes static data */
	public heroes: Hero[] = [];

	/**
	 * Cached map of valid troop names to their database IDs.
	 * NOTE: use `this.units` filtered by type if you need the full {@link Unit} object.
	 */
	public troopNames = new Map<string, number>();
	/**
	 * Cached map of valid spell names to their database IDs.
	 * NOTE: use `this.units` filtered by type if you need the full {@link Unit} object.
	 */
	public spellNames = new Map<string, number>();
	/**
	 * Cached map of valid siege machine names to their database IDs.
	 * NOTE: use `this.units` filtered by type if you need the full {@link Unit} object.
	 */
	public siegeNames = new Map<string, number>();
	/**
	 * Cached map of valid equipment names to their database IDs.
	 * NOTE: use `this.equipment` if you need the full {@link Equipment} object.
	 */
	public equipmentNames = new Map<string, number>();
	/**
	 * Cached map of valid pet names to their database IDs.
	 * NOTE: use `this.pets` if you need the full {@link Pet} object.
	 */
	public petNames = new Map<string, number>();
	/**
	 * Cached set of valid town halls (numeric value).
	 * NOTE: use `this.townHalls` if you need the full {@link TownHall} object.
	 */
	public validTownHalls = new Set<number>();

	/** Reverse lookup maps: URL slug → canonical display name */
	public troopSlugs = new Map<string, string>();
	public spellSlugs = new Map<string, string>();
	public siegeSlugs = new Map<string, string>();
	public equipmentSlugs = new Map<string, string>();
	public petSlugs = new Map<string, string>();
	public heroSlugs = new Map<string, string>();

	constructor(server: Server, settings: GameDataSettings = {}) {
		this.server = server;
		this.log = util.logger('clash-armies:data-sync');
		this.settings = settings;
	}

	/**
	 * Static game data cache, populated by `loadData` during server init.
	 * This DB data is immutable post-startup and should not be modified at runtime.
	 *
	 * Approximate RAM usage: ~185KB (at time of this commit). But unless big schema
	 * changes happen in theory this shouldn't ever drastically increase.
	 */
	public get data(): StaticGameData {
		const { units, equipment, pets, townHalls, heroes } = this;
		return { units, equipment, pets, townHalls, heroes };
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

		const existing = await db.getRow<{ hash: string }>('game_data_sync', { id: 1 });
		if (existing?.hash === hash) {
			this.log.info('Game data unchanged, skipping sync');
			return;
		}

		this.log.info('Game data changed, syncing...');
		const t0 = performance.now();

		const raw = JSON5.parse(gameDataContent);
		const data = GameDataSchema.parse(raw);

		await db.transaction(async (tx) => {
			await this.syncHeroes(tx, data);
			await this.syncTownHalls(tx, data);
			await this.syncUnits(tx, 'Troop', data.troops);
			await this.syncUnits(tx, 'Spell', data.spells);
			await this.syncUnits(tx, 'Siege', data.sieges);
			await this.syncPets(tx, data);
			await this.syncEquipment(tx, data);
			await tx.upsert('game_data_sync', [{ id: 1, hash }]);
		});

		const t1 = performance.now();
		this.log.info(`Game data synced in ${(t1 - t0).toFixed(2)}ms`);
	}

	/**
	 * Loads game data from the database into local map/set caches.
	 * Intended to be ran after `sync` has occurred.
	 */
	public async loadData() {
		this.units = await this.getUnitsData();
		this.equipment = await this.getEquipmentData();
		this.pets = await this.getPetsData();
		this.townHalls = await this.getTownHallsData();
		this.heroes = await this.getHeroesData();

		for (const unit of this.units) {
			const slug = encodeUnitName(unit.name);
			switch (unit.type) {
				case 'Troop':
					this.troopNames.set(unit.name, unit.id);
					this.troopSlugs.set(slug, unit.name);
					break;
				case 'Spell':
					this.spellNames.set(unit.name, unit.id);
					this.spellSlugs.set(slug, unit.name);
					break;
				case 'Siege':
					this.siegeNames.set(unit.name, unit.id);
					this.siegeSlugs.set(slug, unit.name);
					break;
			}
		}
		for (const eq of this.equipment) {
			this.equipmentNames.set(eq.name, eq.id);
			this.equipmentSlugs.set(encodeUnitName(eq.name), eq.name);
		}
		for (const pet of this.pets) {
			this.petNames.set(pet.name, pet.id);
			this.petSlugs.set(encodeUnitName(pet.name), pet.name);
		}
		for (const hero of this.heroes) {
			this.heroSlugs.set(encodeUnitName(hero.name), hero.name);
		}
		for (const th of this.townHalls) {
			this.validTownHalls.add(th.level);
		}
	}

	private async syncHeroes(db: MySQL, data: GameDataType) {
		const heroRows = data.heroes.map((h, idx) => {
			return { name: h.name, clashId: h.clashId, order: idx };
		});
		await db.upsert('heroes', heroRows);
	}

	private async syncTownHalls(db: MySQL, data: GameDataType) {
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
		await db.upsert('town_halls', thRows);

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
		await db.query('DELETE FROM town_hall_heroes_max');
		await db.insertMany('town_hall_heroes_max', heroMaxRows);
	}

	private async syncUnits(db: MySQL, type: 'Troop' | 'Spell' | 'Siege', units: GameDataUnit[]) {
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
		await db.upsert('units', unitRows);

		const idRows = await db.getRows('units', { type });
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
		await db.upsert('unit_levels', levelRows);
	}

	private async syncPets(db: MySQL, data: GameDataType) {
		const petRows = data.pets.map((p, idx) => {
			return { name: p.name, clashId: p.clashId, order: idx };
		});
		await db.upsert('pets', petRows);

		const idRows = await db.getRows('pets');
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
		await db.upsert('pet_levels', levelRows);
	}

	private async syncEquipment(db: MySQL, data: GameDataType) {
		const equipmentRows = data.equipment.map((e, idx) => {
			return {
				hero: e.hero,
				name: e.name,
				epic: e.epic,
				clashId: e.clashId,
				order: idx,
			};
		});
		await db.upsert('equipment', equipmentRows);

		const idRows = await db.getRows('equipment');
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
		await db.upsert('equipment_levels', levelRows);
	}

	private async getUnitsData(options: GetUnitsOptions = {}) {
		const { type } = options;

		const args: (string | number)[] = [];
		let query = `
			SELECT
				u.id,
				u.type,
				u.name,
				u.clashId,
				u.order,
				u.housingSpace,
				u.productionBuilding,
				u.isSuper,
				u.isFlying,
				u.isJumper,
				u.airTargets,
				u.groundTargets,
				JSON_ARRAYAGG(JSON_OBJECT(
					'id', ul.id,
					'unitId', ul.unitId,
					'level', ul.level,
					'buildingLevel', ul.buildingLevel,
					'laboratoryLevel', ul.laboratoryLevel
				) ORDER BY ul.level) AS levels
			FROM units u
			LEFT JOIN unit_levels ul ON ul.unitId = u.id
			WHERE TRUE
		`;

		if (type) {
			query += `
				AND u.type = ?
			`;
			args.push(type);
		}

		query += `
			GROUP BY u.id
			ORDER BY u.order
		`;

		const units = await this.server.db.query<Unit>(query, args);

		for (const unit of units) {
			unit.levels = parseDBJsonField(unit.levels);
		}

		return units;
	}

	private async getEquipmentData() {
		// prettier-ignore
		const equipment = await this.server.db.query<Equipment>(`
			SELECT
				eq.id,
				eq.hero,
				eq.name,
				eq.clashId,
				eq.order,
				eq.epic,
				JSON_ARRAYAGG(JSON_OBJECT(
					'id', eql.id,
					'equipmentId', eql.equipmentId,
					'level', eql.level,
					'blacksmithLevel', eql.blacksmithLevel
				) ORDER BY eql.level) AS levels
			FROM equipment eq
			LEFT JOIN equipment_levels eql ON eql.equipmentId = eq.id
			GROUP BY eq.id
			ORDER BY eq.order
		`, []);

		for (const eq of equipment) {
			eq.levels = parseDBJsonField(eq.levels);
		}

		return equipment;
	}

	private async getPetsData() {
		// prettier-ignore
		const pets = await this.server.db.query<Pet>(`
			SELECT
				p.id,
				p.name,
				p.clashId,
				p.order,
				JSON_ARRAYAGG(JSON_OBJECT(
					'id', pl.id,
					'petId', pl.petId,
					'level', pl.level,
					'petHouseLevel', pl.petHouseLevel
				) ORDER BY pl.level) AS levels
			FROM pets p
			LEFT JOIN pet_levels pl ON pl.petId = p.id
			GROUP BY p.id
			ORDER BY p.order
		`, []);

		for (const pet of pets) {
			pet.levels = parseDBJsonField(pet.levels);
		}

		return pets;
	}

	private async getTownHallsData(): Promise<TownHall[]> {
		const ths = await this.server.db.query<Omit<TownHall, 'heroMaxLevels'>>(`SELECT *, level AS id FROM town_halls ORDER BY level`, []);
		const maxes = await this.server.db.query<{ townHall: number; heroName: string; maxLevel: number }>(
			`SELECT townHall, heroName, maxLevel FROM town_hall_heroes_max`,
			[]
		);

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
		return this.server.db.query<Hero>(`
            SELECT h.name, h.clashId, h.order
            FROM heroes h
            ORDER BY h.order
        `);
	}

	private get gameDataPath() {
		if (typeof this.settings?.filePath === 'string') {
			return this.settings.filePath;
		}
		return path.join(process.cwd(), 'game-data.json5');
	}
}
