import type { MySQL, MigrationFn } from '@ninjalib/sql';
import { type Equipment, type Unit } from '$types';

// Mapping from old `town_halls` hero columns -> hero name.
// Used to flatten denormalized columns into `town_hall_heroes_max`.
const TH_HERO_COLUMNS = [
	{ column: 'maxBarbarianKing', name: 'Barbarian King' },
	{ column: 'maxArcherQueen', name: 'Archer Queen' },
	{ column: 'maxGrandWarden', name: 'Grand Warden' },
	{ column: 'maxRoyalChampion', name: 'Royal Champion' },
	{ column: 'maxMinionPrince', name: 'Minion Prince' },
	{ column: 'maxDragonDuke', name: 'Dragon Duke' },
];

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    // 0) Fix existing bad data in prepartion for UNIQUE constraints in migration 71.
    runStep(64, async (db: MySQL) => {
        // In the `v0_5_0.ts` migration file, a duplicate unit level was added for the "Ice Block" spell.
        // Remove this duplicate entry so the constraints can be made - for exactly this reason.
        const iceBlock = await db.getRow<Unit>('units', { name: 'Ice Block' });
        await db.delete('unit_levels', {
            unitId: iceBlock.id,
            level: 4,
            laboratoryLevel: 15,
        })

        // Migration 25 from `v0_1_1.ts` inserted a duplicate level 5 row, and
        // also forgot to add a level 2 row, for the "Healer Puppet" equipment.
        const healerPuppet = await db.getRow<Equipment>('equipment', { name: 'Healer Puppet' });
        await db.query('DELETE FROM equipment_levels WHERE equipmentId = ? AND level = 5 LIMIT 1', [healerPuppet.id])
        await db.insertOne('equipment_levels', {
            equipmentId: healerPuppet.id,
            level: 2,
            blacksmithLevel: 5
        })

        // Same issue as with the "Healer Puppet" but for "Rage Gem"
        const rageGem = await db.getRow<Equipment>('equipment', { name: 'Rage Gem' });
        await db.query('DELETE FROM equipment_levels WHERE equipmentId = ? AND level = 5 LIMIT 1', [rageGem.id])
        await db.insertOne('equipment_levels', {
            equipmentId: rageGem.id,
            level: 2,
            blacksmithLevel: 4
        })

        // Same issue as with the "Healer Puppet" but for "Healing Tome"
        const healingTome = await db.getRow<Equipment>('equipment', { name: 'Healing Tome' });
        await db.query('DELETE FROM equipment_levels WHERE equipmentId = ? AND level = 5 LIMIT 1', [healingTome.id])
        await db.insertOne('equipment_levels', {
            equipmentId: healingTome.id,
            level: 2,
            blacksmithLevel: 6
        })

        // Same issue as with the "Healer Puppet" but for "Haste Vial"
        const hasteVial = await db.getRow<Equipment>('equipment', { name: 'Haste Vial' });
        await db.query('DELETE FROM equipment_levels WHERE equipmentId = ? AND level = 5 LIMIT 1', [hasteVial.id])
        await db.insertOne('equipment_levels', {
            equipmentId: hasteVial.id,
            level: 2,
            blacksmithLevel: 8
        })

        // Same issue as with the "Healer Puppet" but for "Hog Rider Doll"
        const hogRiderDoll = await db.getRow<Equipment>('equipment', { name: 'Hog Rider Doll' });
        await db.query('DELETE FROM equipment_levels WHERE equipmentId = ? AND level = 5 LIMIT 1', [hogRiderDoll.id])
        await db.insertOne('equipment_levels', {
            equipmentId: hogRiderDoll.id,
            level: 2,
            blacksmithLevel: 7
        })
    });
    // 1) Heroes as a first-class entity.
    runStep(65, async (db: MySQL) => {
        await db.query(`
            CREATE TABLE heroes (
                name VARCHAR(30) NOT NULL PRIMARY KEY,
                clashId INT UNSIGNED NOT NULL
            )
        `);

        const HEROES = {
           	'Barbarian King': 0,
           	'Archer Queen': 1,
           	'Grand Warden': 2,
           	'Royal Champion': 4,
           	'Minion Prince': 6,
           	'Dragon Duke': 7,
        };
        const data = Object.entries(HEROES).map(([name, clashId]) => ({ name, clashId }))
		await db.insertMany('heroes', data);
	});
	// 2) Town hall -> hero max levels join table.
	// Replaces the `maxBarbarianKing`/`maxArcherQueen`/etc... columns on town_halls.
	// This decouples data updates from schema updates.
    runStep(66, async (db: MySQL) => {
        await db.query(`
            CREATE TABLE town_hall_heroes_max (
                townHall SMALLINT UNSIGNED NOT NULL,
                heroName VARCHAR(30) NOT NULL,
                maxLevel SMALLINT UNSIGNED NOT NULL,
                PRIMARY KEY (townHall, heroName),
                CONSTRAINT fk_town_hall_heroes_max_town_hall FOREIGN KEY (townHall) REFERENCES town_halls (level),
                CONSTRAINT fk_town_hall_heroes_max_hero FOREIGN KEY (heroName) REFERENCES heroes (name)
            )
        `);
		// Populate `town_hall_heroes_max` from the columns on current `town_halls`.
		const cols = TH_HERO_COLUMNS.map((c) => c.column).join(', ');
		const rows = await db.query<Record<string, number | null>>(
			`SELECT level, ${cols} FROM town_halls`
		);
		const inserts: { townHall: number; heroName: string; maxLevel: number }[] = [];
		for (const row of rows) {
			for (const { column, name } of TH_HERO_COLUMNS) {
				const max = row[column];
				if (max != null) {
					inserts.push({
						townHall: row.level as number,
						heroName: name,
						maxLevel: max,
					});
				}
			}
		}
		await db.insertMany('town_hall_heroes_max', inserts);
	});
	// 3) Collapse `unit_levels` `barrackLevel`/`spellFactoryLevel` -> `buildingLevel`.
	// laboratoryLevel stays, it's the upgrade requirement so a separate concern.
    runStep(67, async (db: MySQL) => {
        await db.query(`
            ALTER TABLE unit_levels
            ADD COLUMN buildingLevel SMALLINT DEFAULT NULL AFTER level
        `)
        await db.query(`
            UPDATE unit_levels
            SET buildingLevel = COALESCE(barrackLevel, spellFactoryLevel)
        `);
    });
	// 4) Add FK constraints on `equipment.hero` and `army_pets.hero`.
    runStep(68, async (db: MySQL) => {
        await db.query(`
            ALTER TABLE equipment
            ADD CONSTRAINT fk_equipment_hero FOREIGN KEY (hero) REFERENCES heroes (name)
        `);
        await db.query(`
            ALTER TABLE army_pets
            ADD CONSTRAINT fk_army_pets_hero FOREIGN KEY (hero) REFERENCES heroes (name)
        `);
    });
    // 5) Drop (now) obsolete columns.
    runStep(69, async (db: MySQL) => {
        await db.query(`
            ALTER TABLE town_halls
            DROP COLUMN maxBarbarianKing,
            DROP COLUMN maxArcherQueen,
            DROP COLUMN maxGrandWarden,
            DROP COLUMN maxRoyalChampion,
            DROP COLUMN maxMinionPrince,
            DROP COLUMN maxDragonDuke
        `);
        await db.query(`
            ALTER TABLE unit_levels
            DROP COLUMN barrackLevel,
            DROP COLUMN spellFactoryLevel
        `);
    });
	// 6) Create sync state table - single row holds the hash of the last-applied data file.
	runStep(70, `
	    CREATE TABLE game_data_sync (
		    id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
			hash VARCHAR(64) NOT NULL,
			appliedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
			CHECK (id = 1)
		)
	`);
	// 7) UNIQUE constraints on for each levels table.
	// Makes syncing added/updated levels much easier, since we can just upsert.
	// Also a defensive measure to prevent accidental duplicate level rows.
    runStep(71, async (db: MySQL) => {
        await db.query('ALTER TABLE unit_levels ADD CONSTRAINT unique_unit_levels_unit_level UNIQUE (unitId, level)');
        await db.query('ALTER TABLE pet_levels ADD CONSTRAINT unique_pet_levels_pet_level UNIQUE (petId, level)');
        await db.query('ALTER TABLE equipment_levels ADD CONSTRAINT unique_equipment_levels_equipment_level UNIQUE (equipmentId, level)');
    });
    // 8) Add `order` columns to applicable tables so that game data file
    // can decide the UI order (natural order when upserting during sync isn't reliable).
    runStep(72, async (db: MySQL) => {
        // Orders start as 0 but game data sync will update this on startup.
        await db.query('ALTER TABLE heroes ADD COLUMN `order` INT NOT NULL DEFAULT 0');
        await db.query('ALTER TABLE units ADD COLUMN `order` INT NOT NULL DEFAULT 0');
        await db.query('ALTER TABLE pets ADD COLUMN `order` INT NOT NULL DEFAULT 0');
        await db.query('ALTER TABLE equipment ADD COLUMN `order` INT NOT NULL DEFAULT 0');
    })
}
